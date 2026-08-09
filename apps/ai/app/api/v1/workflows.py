from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.tools import knowledge_search, search_trials, sql_metrics
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import AuditLog, User, Workflow, WorkflowRun
from app.schemas import WorkflowIn, WorkflowOut

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=list[WorkflowOut])
def list_workflows(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Workflow).where(Workflow.org_id == user.org_id)).all()
    return rows


@router.post("", response_model=WorkflowOut)
def create_workflow(body: WorkflowIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wf = Workflow(
        org_id=user.org_id,
        name=body.name,
        description=body.description,
        steps=body.steps
        or [
            {"id": "ingest", "label": "Ingest", "type": "ingest"},
            {"id": "extract", "label": "Extract", "type": "extract"},
            {"id": "analyze", "label": "Analyze", "type": "analyze"},
            {"id": "approve", "label": "Approve", "type": "approve"},
            {"id": "notify", "label": "Notify", "type": "notify"},
        ],
    )
    db.add(wf)
    db.commit()
    db.refresh(wf)
    return wf


@router.post("/{workflow_id}/run")
async def run_workflow(workflow_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wf = db.get(Workflow, workflow_id)
    if not wf or wf.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Workflow not found")

    run = WorkflowRun(workflow_id=wf.id, org_id=user.org_id, status="running", step_results=[])
    db.add(run)
    db.commit()
    db.refresh(run)

    step_results: list[dict[str, Any]] = []
    for step in wf.steps:
        stype = step.get("type", "analyze")
        detail: Any
        if stype == "ingest":
            detail = knowledge_search(db, user.org_id, wf.name)
        elif stype == "extract":
            detail = await search_trials(wf.name)
        elif stype == "analyze":
            detail = sql_metrics()
        elif stype == "approve":
            detail = {"status": "auto-approved", "by": user.email}
        else:
            detail = {"notified": ["executives@lsi.os", user.email], "channel": "in-app"}
        step_results.append({"step": step, "result": detail, "status": "completed"})

    run.step_results = step_results
    run.status = "completed"
    run.completed_at = datetime.now(timezone.utc)
    db.add(AuditLog(org_id=user.org_id, user_id=user.id, action="workflow_run", resource=run.id))
    db.commit()
    return {
        "id": run.id,
        "workflow_id": wf.id,
        "status": run.status,
        "step_results": run.step_results,
        "completed_at": run.completed_at,
    }


@router.get("/runs/recent")
def recent_runs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    runs = db.scalars(
        select(WorkflowRun).where(WorkflowRun.org_id == user.org_id).order_by(WorkflowRun.created_at.desc()).limit(20)
    ).all()
    return [
        {
            "id": r.id,
            "workflow_id": r.workflow_id,
            "status": r.status,
            "created_at": r.created_at,
            "completed_at": r.completed_at,
            "steps_completed": len(r.step_results or []),
        }
        for r in runs
    ]
