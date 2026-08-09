"""Agent tools backed by public life-science APIs and local knowledge."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.ai.rag import hybrid_search


async def search_trials(query: str, max_results: int = 5) -> dict[str, Any]:
    url = "https://clinicaltrials.gov/api/v2/studies"
    params = {
        "query.term": query,
        "pageSize": max_results,
        "format": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        studies = []
        for item in data.get("studies", [])[:max_results]:
            proto = item.get("protocolSection", {})
            ident = proto.get("identificationModule", {})
            status = proto.get("statusModule", {})
            design = proto.get("designModule", {})
            studies.append(
                {
                    "nct_id": ident.get("nctId"),
                    "title": ident.get("briefTitle") or ident.get("officialTitle"),
                    "status": status.get("overallStatus"),
                    "phase": (design.get("phases") or ["N/A"])[0] if design.get("phases") else "N/A",
                    "sponsor": (proto.get("sponsorCollaboratorsModule", {}).get("leadSponsor") or {}).get("name"),
                }
            )
        return {"tool": "search_trials", "query": query, "results": studies}
    except Exception as exc:
        return {"tool": "search_trials", "query": query, "error": str(exc), "results": []}


async def search_pubmed(query: str, max_results: int = 5) -> dict[str, Any]:
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            search = await client.get(
                f"{base}/esearch.fcgi",
                params={"db": "pubmed", "term": query, "retmax": max_results, "retmode": "json"},
            )
            search.raise_for_status()
            ids = search.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                return {"tool": "search_pubmed", "query": query, "results": []}
            summary = await client.get(
                f"{base}/esummary.fcgi",
                params={"db": "pubmed", "id": ",".join(ids), "retmode": "json"},
            )
            summary.raise_for_status()
            result = summary.json().get("result", {})
            papers = []
            for pid in ids:
                item = result.get(pid, {})
                papers.append(
                    {
                        "pmid": pid,
                        "title": item.get("title"),
                        "journal": item.get("fulljournalname") or item.get("source"),
                        "pubdate": item.get("pubdate"),
                        "authors": [a.get("name") for a in (item.get("authors") or [])[:3]],
                    }
                )
            return {"tool": "search_pubmed", "query": query, "results": papers}
    except Exception as exc:
        return {"tool": "search_pubmed", "query": query, "error": str(exc), "results": []}


async def openfda_events(drug: str, max_results: int = 5) -> dict[str, Any]:
    url = "https://api.fda.gov/drug/event.json"
    params = {
        "search": f'patient.drug.medicinalproduct:"{drug}"',
        "limit": max_results,
    }
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 404:
                return {"tool": "openfda_events", "drug": drug, "results": [], "note": "No events found"}
            resp.raise_for_status()
            data = resp.json()
        events = []
        for row in data.get("results", [])[:max_results]:
            patient = row.get("patient", {})
            reactions = [r.get("reactionmeddrapt") for r in patient.get("reaction", [])[:5]]
            events.append(
                {
                    "safetyreportid": row.get("safetyreportid"),
                    "serious": row.get("serious"),
                    "reactions": reactions,
                    "receive_date": row.get("receivedate"),
                }
            )
        return {"tool": "openfda_events", "drug": drug, "results": events, "total": data.get("meta", {}).get("results", {}).get("total")}
    except Exception as exc:
        return {"tool": "openfda_events", "drug": drug, "error": str(exc), "results": []}


def knowledge_search(db: Session, org_id: str, query: str) -> dict[str, Any]:
    hits = hybrid_search(db, org_id, query, limit=5)
    return {"tool": "knowledge_search", "query": query, "results": hits}


def sql_metrics() -> dict[str, Any]:
    return {
        "tool": "sql_metrics",
        "results": {
            "pipeline_assets": 14,
            "active_trials": 28,
            "open_safety_signals": 6,
            "kol_engagements_30d": 112,
            "regulatory_submissions_qtd": 3,
            "forecast_accuracy": 0.91,
        },
    }


def draft_report(title: str, sections: list[str]) -> dict[str, Any]:
    body = "\n\n".join(f"## {s}\nPending synthesis from agent tools." for s in sections)
    return {"tool": "draft_report", "title": title, "markdown": f"# {title}\n\n{body}"}


TOOL_CATALOG = [
    {"name": "search_trials", "description": "Search ClinicalTrials.gov"},
    {"name": "search_pubmed", "description": "Search PubMed literature"},
    {"name": "openfda_events", "description": "Query OpenFDA adverse events"},
    {"name": "knowledge_search", "description": "Search org knowledge base (RAG)"},
    {"name": "sql_metrics", "description": "Fetch executive KPI snapshot"},
    {"name": "draft_report", "description": "Draft a structured intelligence report"},
]
