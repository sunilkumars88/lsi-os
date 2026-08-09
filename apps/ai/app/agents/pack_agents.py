"""Industry pack agents — Life Sciences, Banking, Insurance (OpenAI-backed)."""

from __future__ import annotations

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

PACK_AGENTS: dict[str, dict[str, Any]] = {
    "life-sciences": {
        "trial_coordinator": {
            "name": "Trial Coordinator Agent",
            "tools": ["search_trials", "knowledge_search", "search_pubmed"],
            "requires_approval": False,
            "prompt": "trial_coordinator",
        },
        "safety_monitor": {
            "name": "Safety Monitoring Agent",
            "tools": ["openfda_events", "knowledge_search", "search_pubmed"],
            "requires_approval": True,
            "prompt": "safety",
        },
        "protocol_compliance": {
            "name": "Protocol Compliance Agent",
            "tools": ["knowledge_search", "draft_report", "search_trials"],
            "requires_approval": True,
            "prompt": "regulatory",
        },
        "regulatory_docs": {
            "name": "Regulatory Documentation Agent",
            "tools": ["knowledge_search", "search_trials", "draft_report"],
            "requires_approval": True,
            "prompt": "regulatory",
        },
    },
    "banking": {
        "loan_originator": {
            "name": "Loan Origination Agent",
            "tools": ["sql_metrics", "knowledge_search", "draft_report"],
            "requires_approval": True,
            "prompt": "loan_originator",
        },
        "fraud_detector": {
            "name": "Fraud Detection Agent",
            "tools": ["sql_metrics", "knowledge_search"],
            "requires_approval": False,
            "prompt": "fraud_detector",
        },
        "aml_compliance": {
            "name": "AML/KYC Compliance Agent",
            "tools": ["knowledge_search", "draft_report"],
            "requires_approval": True,
            "prompt": "aml_compliance",
        },
        "customer_support": {
            "name": "Customer Support Agent",
            "tools": ["knowledge_search"],
            "requires_approval": False,
            "prompt": "copilot",
        },
    },
    "insurance": {
        "claims_triage": {
            "name": "Claims Triage Agent",
            "tools": ["knowledge_search", "sql_metrics"],
            "requires_approval": False,
            "prompt": "claims_triage",
        },
        "underwriting": {
            "name": "Underwriting Support Agent",
            "tools": ["knowledge_search", "sql_metrics", "draft_report"],
            "requires_approval": True,
            "prompt": "analyst",
        },
        "siu": {
            "name": "SIU Pattern Finder",
            "tools": ["sql_metrics", "knowledge_search"],
            "requires_approval": True,
            "prompt": "fraud_detector",
        },
    },
}


async def _run_tools(db: Session, org_id: str, query: str, tools: list[str]) -> list[dict[str, Any]]:
    traces: list[dict[str, Any]] = []
    drug = query.split()[0] if query else "aspirin"
    if "search_trials" in tools:
        traces.append(await search_trials(query))
    if "search_pubmed" in tools:
        traces.append(await search_pubmed(query))
    if "openfda_events" in tools:
        traces.append(await openfda_events(drug))
    if "knowledge_search" in tools:
        traces.append(knowledge_search(db, org_id, query))
    if "sql_metrics" in tools:
        traces.append(sql_metrics())
    if "draft_report" in tools:
        traces.append(draft_report(query[:80] or "Pack report", ["Summary", "Evidence", "Next actions"]))
    return traces


async def run_pack_agent(
    db: Session,
    org_id: str,
    pack_id: str,
    agent_id: str,
    query: str,
) -> dict[str, Any]:
    pack = PACK_AGENTS.get(pack_id)
    if not pack:
        raise ValueError(f"Unknown pack: {pack_id}")
    spec = pack.get(agent_id)
    if not spec:
        raise ValueError(f"Unknown agent {agent_id} for pack {pack_id}")

    traces = await _run_tools(db, org_id, query, spec["tools"])
    system = PROMPT_LIBRARY.get(spec["prompt"], PROMPT_LIBRARY["copilot"])
    system += "\n\nCONTEXT:\n" + "\n---\n".join(str(t)[:1400] for t in traces)
    llm = await llm_router.complete(
        [{"role": "user", "content": f"Run {spec['name']} objective: {query}"}],
        system=system,
    )
    return {
        "pack_id": pack_id,
        "agent_id": agent_id,
        "name": spec["name"],
        "requires_approval": spec["requires_approval"],
        "status": "awaiting_approval" if spec["requires_approval"] else "completed",
        "summary": llm.content,
        "provider": llm.provider,
        "model": llm.model,
        "tool_traces": traces,
        "error": llm.error,
    }


def list_pack_agents(pack_id: str | None = None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    packs = {pack_id: PACK_AGENTS[pack_id]} if pack_id and pack_id in PACK_AGENTS else PACK_AGENTS
    for pid, agents in packs.items():
        for aid, spec in agents.items():
            out.append(
                {
                    "pack_id": pid,
                    "id": aid,
                    "name": spec["name"],
                    "tools": spec["tools"],
                    "requires_approval": spec["requires_approval"],
                }
            )
    return out
