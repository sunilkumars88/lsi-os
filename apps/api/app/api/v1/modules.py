from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.ai.tools import openfda_events, search_pubmed, search_trials
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("/dashboard")
def executive_dashboard(user: User = Depends(get_current_user)):
    return {
        "kpis": [
            {"id": "arr", "label": "Pipeline Value", "value": "$2.4B", "delta": "+6.2%", "trend": "up"},
            {"id": "trials", "label": "Active Trials", "value": "28", "delta": "+3", "trend": "up"},
            {"id": "signals", "label": "Open Safety Signals", "value": "6", "delta": "-2", "trend": "down"},
            {"id": "subs", "label": "Regulatory Filings QTD", "value": "3", "delta": "on track", "trend": "flat"},
            {"id": "kol", "label": "KOL Engagements (30d)", "value": "112", "delta": "+18%", "trend": "up"},
            {"id": "ai", "label": "AI Task Completion", "value": "94%", "delta": "+2.1%", "trend": "up"},
        ],
        "briefing": (
            "Portfolio risk is concentrated in Oncology Phase III assets. "
            "Safety signals for lead CV product are declining. "
            "Recommend accelerating HEOR evidence package for EU HTA."
        ),
        "risks": [
            {"title": "Oncology Ph3 enrollment lag", "severity": "high", "owner": "Clinical Ops"},
            {"title": "Label negotiation — EU", "severity": "medium", "owner": "Regulatory"},
            {"title": "Competitor launch — immunology", "severity": "medium", "owner": "Commercial"},
        ],
        "ai_actions": [
            "Run Safety Sentinel on lead CV brand",
            "Draft competitive brief for immunology launch",
            "Summarize latest PubMed evidence for HEOR dossier",
        ],
    }


@router.get("/commercial")
def commercial(user: User = Depends(get_current_user)):
    return {
        "brands": [
            {"name": "CardiaX", "share": 18.4, "growth": 4.2, "hcp_reach": 4200, "nrx": 12800},
            {"name": "OncoPrime", "share": 11.1, "growth": 9.8, "hcp_reach": 2100, "nrx": 5400},
            {"name": "ImmunoPath", "share": 7.6, "growth": -1.2, "hcp_reach": 1800, "nrx": 3900},
        ],
        "competitors": [
            {"name": "Rival-A", "move": "Expanded specialty pharmacy network", "impact": "medium"},
            {"name": "Rival-B", "move": "DTP campaign in top 10 MSAs", "impact": "high"},
        ],
        "insights": [
            "CardiaX growth driven by cardiology KOLs in Mid-Atlantic.",
            "OncoPrime share gains correlate with new biomarker testing coverage.",
        ],
    }


@router.get("/medical")
async def medical(q: str = Query("immunotherapy checkpoint"), user: User = Depends(get_current_user)):
    pubmed = await search_pubmed(q, max_results=6)
    return {
        "query": q,
        "kols": [
            {"name": "Dr. Maya Chen", "specialty": "Oncology", "influence": 92, "recent_topic": "PD-1 combinations"},
            {"name": "Dr. Luis Ortega", "specialty": "Cardiology", "influence": 88, "recent_topic": "SGLT2 outcomes"},
            {"name": "Dr. Aisha Rahman", "specialty": "Immunology", "influence": 85, "recent_topic": "IL-17 safety"},
        ],
        "publications": pubmed.get("results", []),
        "msls_focus": ["Congress abstract mining", "Advisory board synthesis", "Medical information FAQs"],
    }


@router.get("/clinical")
async def clinical(q: str = Query("oncology immunotherapy"), user: User = Depends(get_current_user)):
    trials = await search_trials(q, max_results=10)
    return {
        "query": q,
        "trials": trials.get("results", []),
        "ops": {
            "sites_activated": 146,
            "screen_fail_rate": 0.22,
            "median_enrollment_days": 118,
            "protocol_amendments_ytd": 7,
        },
        "error": trials.get("error"),
    }


@router.get("/heor")
def heor(user: User = Depends(get_current_user)):
    return {
        "evidence": [
            {"study": "RWE CardiaX 24m", "design": "Retrospective cohort", "endpoint": "Hospitalization", "result": "-18% vs SOC"},
            {"study": "OncoPrime QALY", "design": "Markov model", "endpoint": "ICER", "result": "$64k/QALY"},
            {"study": "ImmunoPath adherence", "design": "Claims RWE", "endpoint": "PDC", "result": "0.81"},
        ],
        "hta": [
            {"market": "NICE", "status": "In review", "risk": "medium"},
            {"market": "G-BA", "status": "Additional benefit pending", "risk": "high"},
            {"market": "HAS", "status": "ASMR III expected", "risk": "low"},
        ],
        "recommendations": [
            "Expand RWE to include underrepresented populations.",
            "Prepare budget-impact model for US payer dossier refresh.",
        ],
    }


@router.get("/regulatory")
def regulatory(user: User = Depends(get_current_user)):
    return {
        "guidances": [
            {"title": "Oncology clinical trial endpoints", "agency": "FDA", "updated": "2025-11-02", "relevance": "high"},
            {"title": "RWE for regulatory decision-making", "agency": "FDA", "updated": "2025-08-14", "relevance": "high"},
            {"title": "Pharmacovigilance system master file", "agency": "EMA", "updated": "2025-06-01", "relevance": "medium"},
        ],
        "submissions": [
            {"name": "sNDA CardiaX", "type": "sNDA", "status": "CMC responses pending", "due": "2026-09-15"},
            {"name": "MAA OncoPrime", "type": "MAA", "status": "Day 120 questions", "due": "2026-08-30"},
        ],
        "readiness": {"cmc": 78, "clinical": 91, "labeling": 84, "safety": 88},
    }


@router.get("/safety")
async def safety(drug: str = Query("aspirin"), user: User = Depends(get_current_user)):
    events = await openfda_events(drug, max_results=8)
    return {
        "drug": drug,
        "total_reports": events.get("total"),
        "events": events.get("results", []),
        "signals": [
            {"term": "Gastrointestinal haemorrhage", "score": 0.82, "trend": "stable"},
            {"term": "Hypersensitivity", "score": 0.61, "trend": "down"},
            {"term": "Renal impairment", "score": 0.44, "trend": "up"},
        ],
        "error": events.get("error"),
        "note": events.get("note"),
    }


@router.get("/marketplace")
def marketplace(user: User = Depends(get_current_user)):
    return {
        "items": [
            {
                "id": "agent-safety",
                "name": "Safety Sentinel Pack",
                "category": "Agents",
                "description": "OpenFDA + PubMed multi-agent safety triage with approval gates.",
                "price": "Included",
            },
            {
                "id": "rag-regulatory",
                "name": "Regulatory RAG Corpus",
                "category": "Knowledge",
                "description": "Curated FDA/EMA guidance chunks with citation templates.",
                "price": "Enterprise",
            },
            {
                "id": "sdk-python",
                "name": "LSI Python SDK",
                "category": "SDK",
                "description": "Typed client for chat, agents, knowledge, and module APIs.",
                "price": "Open",
            },
            {
                "id": "workflow-hta",
                "name": "HTA Dossier Workflow",
                "category": "Workflows",
                "description": "Ingest → extract outcomes → analyze ICER → approve → notify.",
                "price": "Professional",
            },
        ]
    }
