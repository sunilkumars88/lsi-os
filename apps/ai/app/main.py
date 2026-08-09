from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import admin, agents, auth, chat, embeddings, knowledge, modules, packs, workflows
from app.api.v1.agents import AgentRunIn, AgentRunOut, run_agent_internal
from app.api.v1.embeddings import EmbeddingsIn, EmbeddingsOut, create_embeddings
from app.core.config import get_settings
from app.db.session import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    init_db()
    if settings.seed_on_startup:
        from app.db.seed import seed

        try:
            seed()
        except Exception as exc:
            print(f"Seed warning: {exc}")
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(knowledge.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")
app.include_router(embeddings.router, prefix="/api/v1")
app.include_router(workflows.router, prefix="/api/v1")
app.include_router(modules.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(packs.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "llm_provider": __import__("app.ai.llm_router", fromlist=["llm_router"]).llm_router.resolve_provider(),
        "openai_only": True,
    }


@app.get("/")
def root():
    return {"message": "EIOS AI", "docs": "/docs", "health": "/health"}


# Nest aliases — Nest calls `${AI_SERVICE_URL}/agents/run` and `/embeddings`
@app.post("/agents/run", response_model=AgentRunOut)
async def agents_run_alias(body: AgentRunIn) -> AgentRunOut:
    return await run_agent_internal(body)


@app.post("/embeddings", response_model=EmbeddingsOut)
async def embeddings_alias(body: EmbeddingsIn) -> EmbeddingsOut:
    return await create_embeddings(body)
