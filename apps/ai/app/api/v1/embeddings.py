from pydantic import BaseModel, Field

from fastapi import APIRouter

from app.ai.embeddings import embed_texts

router = APIRouter(prefix="/embeddings", tags=["embeddings"])


class EmbeddingsIn(BaseModel):
    texts: list[str] = Field(default_factory=list)


class EmbeddingsOut(BaseModel):
    embeddings: list[list[float]]


@router.post("", response_model=EmbeddingsOut)
async def create_embeddings(body: EmbeddingsIn) -> EmbeddingsOut:
    vectors = await embed_texts(body.texts)
    return EmbeddingsOut(embeddings=vectors)
