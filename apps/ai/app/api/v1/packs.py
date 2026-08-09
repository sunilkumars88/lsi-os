from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agents.pack_agents import list_pack_agents, run_pack_agent
from app.api.deps import get_current_user, get_db
from app.models import User

router = APIRouter(prefix="/packs", tags=["packs"])


class PackRunIn(BaseModel):
    agent_id: str
    query: str = Field(..., min_length=1)


@router.get("/agents")
def pack_agents(pack_id: str | None = None, _: User = Depends(get_current_user)):
    return list_pack_agents(pack_id)


@router.post("/{pack_id}/agents/run")
async def pack_agent_run(
    pack_id: str,
    body: PackRunIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await run_pack_agent(db, user.org_id, pack_id, body.agent_id, body.query)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
