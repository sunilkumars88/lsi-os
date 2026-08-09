from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.llm_router import llm_router
from app.api.deps import require_roles
from app.db.session import get_db
from app.models import AuditLog, UsageMeter, User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def list_users(user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    users = db.scalars(select(User).where(User.org_id == user.org_id)).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.get("/audit")
def audit_logs(user: User = Depends(require_roles("admin", "compliance")), db: Session = Depends(get_db)):
    logs = db.scalars(
        select(AuditLog).where(AuditLog.org_id == user.org_id).order_by(AuditLog.created_at.desc()).limit(100)
    ).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "resource": l.resource,
            "user_id": l.user_id,
            "details": l.details,
            "created_at": l.created_at,
        }
        for l in logs
    ]


@router.get("/models")
def model_routing(user: User = Depends(require_roles("admin"))):
    provider = llm_router.resolve_provider()
    return {
        "active_provider": provider,
        "routes": [
            {"task": "chat", "tier": "fast", "provider": provider},
            {"task": "agent_synthesis", "tier": "quality", "provider": provider},
            {"task": "embeddings", "tier": "local", "provider": "demo-hash"},
        ],
        "note": "Set OPENAI_API_KEY to enable cloud LLMs (OpenAI-only).",
    }


@router.get("/usage")
def usage(user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    rows = db.execute(
        select(
            UsageMeter.provider,
            UsageMeter.model,
            func.sum(UsageMeter.tokens_in),
            func.sum(UsageMeter.tokens_out),
            func.sum(UsageMeter.cost_usd),
            func.count(),
        )
        .where(UsageMeter.org_id == user.org_id)
        .group_by(UsageMeter.provider, UsageMeter.model)
    ).all()
    return {
        "meters": [
            {
                "provider": r[0],
                "model": r[1],
                "tokens_in": int(r[2] or 0),
                "tokens_out": int(r[3] or 0),
                "cost_usd": float(r[4] or 0),
                "calls": int(r[5] or 0),
            }
            for r in rows
        ]
    }
