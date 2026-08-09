from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.ai.llm_router import PROMPT_LIBRARY, llm_router
from app.ai.tools import (
    draft_report,
    knowledge_search,
    openfda_events,
    search_pubmed,
    search_trials,
    sql_metrics,
)
from app.models import AgentJob, UsageMeter


AGENT_TYPES = {
    "researcher": {
        "name": "Clinical Researcher",
        "tools": ["search_trials", "search_pubmed", "knowledge_search"],
        "requires_approval": False,
    },
    "analyst": {
        "name": "Commercial Analyst",
        "tools": ["sql_metrics", "knowledge_search", "draft_report"],
        "requires_approval": False,
    },
    "safety": {
        "name": "Safety Sentinel",
        "tools": ["openfda_events", "search_pubmed", "knowledge_search"],
        "requires_approval": True,
    },
    "regulatory": {
        "name": "Regulatory Navigator",
        "tools": ["knowledge_search", "search_trials", "draft_report"],
        "requires_approval": True,
    },
}


async def run_agent_job(db: Session, job: AgentJob) -> AgentJob:
    spec = AGENT_TYPES.get(job.agent_type, AGENT_TYPES["researcher"])
    query = (job.input or {}).get("query") or job.name
    plan = [
        {"step": 1, "action": "plan", "detail": f"Analyze objective for {spec['name']}"},
        {"step": 2, "action": "retrieve", "detail": f"Invoke tools: {', '.join(spec['tools'])}"},
        {"step": 3, "action": "synthesize", "detail": "Produce cited intelligence brief"},
    ]
    job.plan = plan
    job.status = "running"
    job.requires_approval = bool(spec["requires_approval"])
    db.commit()

    traces: list[dict[str, Any]] = []
    drug_guess = query.split()[0] if query else "aspirin"

    if "search_trials" in spec["tools"]:
        traces.append(await search_trials(query))
    if "search_pubmed" in spec["tools"]:
        traces.append(await search_pubmed(query))
    if "openfda_events" in spec["tools"]:
        traces.append(await openfda_events(drug_guess))
    if "knowledge_search" in spec["tools"]:
        traces.append(knowledge_search(db, job.org_id, query))
    if "sql_metrics" in spec["tools"]:
        traces.append(sql_metrics())
    if "draft_report" in spec["tools"]:
        traces.append(draft_report(job.name, ["Executive Summary", "Evidence", "Recommendations"]))

    context_bits = []
    for t in traces:
        context_bits.append(str(t)[:1200])
    system = (
        f"{PROMPT_LIBRARY.get(job.agent_type, PROMPT_LIBRARY['copilot'])}\n\nCONTEXT:\n"
        + "\n---\n".join(context_bits)
    )
    llm = await llm_router.complete(
        [{"role": "user", "content": f"Run agent objective: {query}"}],
        system=system,
    )
    db.add(
        UsageMeter(
            org_id=job.org_id,
            provider=llm.provider,
            model=llm.model,
            tokens_in=llm.tokens_in,
            tokens_out=llm.tokens_out,
            cost_usd=llm.cost_usd,
        )
    )

    job.result = {
        "summary": llm.content,
        "tool_traces": traces,
        "model": llm.model,
        "provider": llm.provider,
    }
    if job.requires_approval and job.approved is not True:
        job.status = "awaiting_approval"
    else:
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return job
