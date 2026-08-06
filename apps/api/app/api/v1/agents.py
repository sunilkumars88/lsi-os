from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.agents import AGENT_TYPES, run_agent_job
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import AgentJob, AuditLog, User
from app.schemas import AgentJobIn

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/types")
def list_agent_types():
    return [
        {"id": k, "name": v["name"], "tools": v["tools"], "requires_approval": v["requires_approval"]}
        for k, v in AGENT_TYPES.items()
    ]


@router.get("/jobs")
def list_jobs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.scalars(
        select(AgentJob).where(AgentJob.org_id == user.org_id).order_by(AgentJob.created_at.desc()).limit(50)
    ).all()
    return [
        {
            "id": j.id,
            "name": j.name,
            "agent_type": j.agent_type,
            "status": j.status,
            "requires_approval": j.requires_approval,
            "approved": j.approved,
            "created_at": j.created_at,
            "completed_at": j.completed_at,
            "result_preview": (j.result or {}).get("summary", "")[:240],
        }
        for j in jobs
    ]


@router.post("/jobs")
async def create_job(body: AgentJobIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.agent_type not in AGENT_TYPES:
        raise HTTPException(status_code=400, detail="Unknown agent type")
    job = AgentJob(
        org_id=user.org_id,
        user_id=user.id,
        name=body.name,
        agent_type=body.agent_type,
        input={"query": body.query},
        status="queued",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    job = await run_agent_job(db, job)
    db.add(AuditLog(org_id=user.org_id, user_id=user.id, action="agent_run", resource=job.id, details={"type": body.agent_type}))
    db.commit()
    return {
        "id": job.id,
        "name": job.name,
        "agent_type": job.agent_type,
        "status": job.status,
        "plan": job.plan,
        "result": job.result,
        "requires_approval": job.requires_approval,
        "approved": job.approved,
    }


@router.get("/jobs/{job_id}")
def get_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.get(AgentJob, job_id)
    if not job or job.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id,
        "name": job.name,
        "agent_type": job.agent_type,
        "status": job.status,
        "plan": job.plan,
        "result": job.result,
        "requires_approval": job.requires_approval,
        "approved": job.approved,
        "created_at": job.created_at,
        "completed_at": job.completed_at,
    }


@router.post("/jobs/{job_id}/approve")
async def approve_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.get(AgentJob, job_id)
    if not job or job.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Job not found")
    job.approved = True
    job.status = "completed"
    job.completed_at = datetime.now(timezone.utc)
    db.add(AuditLog(org_id=user.org_id, user_id=user.id, action="agent_approve", resource=job.id))
    db.commit()
    return {"id": job.id, "status": job.status, "approved": True}


@router.post("/jobs/{job_id}/reject")
def reject_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.get(AgentJob, job_id)
    if not job or job.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Job not found")
    job.approved = False
    job.status = "rejected"
    job.completed_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": job.id, "status": job.status, "approved": False}
