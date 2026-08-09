from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.llm_router import PROMPT_LIBRARY, llm_router
from app.ai.rag import hybrid_search
from app.ai.tools import openfda_events, search_pubmed, search_trials, sql_metrics
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import AuditLog, ChatMessage, ChatSession, UsageMeter, User
from app.schemas import ChatIn, ChatOut

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/sessions")
def list_sessions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.scalars(
        select(ChatSession)
        .where(ChatSession.org_id == user.org_id, ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
    ).all()
    return [
        {"id": s.id, "title": s.title, "created_at": s.created_at, "message_count": len(s.messages)}
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
def get_session(session_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        return {"error": "not found"}
    return {
        "id": session.id,
        "title": session.title,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "citations": m.citations,
                "tool_traces": m.tool_traces,
                "model": m.model,
                "created_at": m.created_at,
            }
            for m in session.messages
        ],
    }


@router.post("", response_model=ChatOut)
async def chat(body: ChatIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ChatOut:
    if body.session_id:
        session = db.get(ChatSession, body.session_id)
        if not session or session.user_id != user.id:
            session = None
    else:
        session = None

    if not session:
        title = body.message[:60] + ("…" if len(body.message) > 60 else "")
        session = ChatSession(org_id=user.org_id, user_id=user.id, title=title)
        db.add(session)
        db.flush()

    db.add(ChatMessage(session_id=session.id, role="user", content=body.message))
    db.commit()

    citations = []
    tool_traces = []
    context_parts: list[str] = []

    if body.use_rag:
        citations = hybrid_search(db, user.org_id, body.message, limit=5)
        if citations:
            context_parts.append("Knowledge hits:\n" + "\n".join(f"- {c['title']}: {c['content'][:300]}" for c in citations))

    if body.use_tools:
        lowered = body.message.lower()
        if any(k in lowered for k in ("trial", "nct", "clinical", "phase")):
            tool_traces.append(await search_trials(body.message))
        if any(k in lowered for k in ("pubmed", "paper", "literature", "publication")):
            tool_traces.append(await search_pubmed(body.message))
        if any(k in lowered for k in ("adverse", "safety", "faers", "pharmacovigilance", "signal")):
            drug = body.message.split()[-1]
            tool_traces.append(await openfda_events(drug))
        if any(k in lowered for k in ("kpi", "metric", "dashboard", "forecast", "pipeline")):
            tool_traces.append(sql_metrics())
        for t in tool_traces:
            context_parts.append(str(t)[:1500])

    system = PROMPT_LIBRARY["copilot"]
    if context_parts:
        system += "\n\nCONTEXT:\n" + "\n---\n".join(context_parts)

    history = [
        {"role": m.role, "content": m.content}
        for m in session.messages
        if m.role in ("user", "assistant")
    ][-8:]
    history.append({"role": "user", "content": body.message})

    llm = await llm_router.complete(history, system=system)
    msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=llm.content,
        citations=citations,
        tool_traces=tool_traces,
        model=llm.model,
        tokens_in=llm.tokens_in,
        tokens_out=llm.tokens_out,
    )
    db.add(msg)
    db.add(
        UsageMeter(
            org_id=user.org_id,
            provider=llm.provider,
            model=llm.model,
            tokens_in=llm.tokens_in,
            tokens_out=llm.tokens_out,
            cost_usd=llm.cost_usd,
        )
    )
    db.add(AuditLog(org_id=user.org_id, user_id=user.id, action="chat", resource=session.id))
    db.commit()
    db.refresh(msg)

    return ChatOut(
        session_id=session.id,
        message_id=msg.id,
        content=msg.content,
        citations=citations,
        tool_traces=tool_traces,
        model=llm.model,
        provider=llm.provider,
    )
