from pathlib import Path

from sqlalchemy import select

from app.ai.rag import ingest_document
from app.core.security import hash_password
from app.db.session import SessionLocal, init_db
from app.models import Document, Organization, User, Workflow


SEED_DOCS = [
    {
        "title": "CardiaX Phase III Synopsis",
        "doc_type": "protocol",
        "content": (
            "CardiaX is an oral SGLT2-pathway modulator in Phase III for HFpEF. "
            "Primary endpoint: cardiovascular death or HF hospitalization at 24 months. "
            "Key inclusion: LVEF >= 50%, NYHA II-III, elevated NT-proBNP. "
            "Enrollment target 4200 subjects across 180 sites. Current enrollment lag in APAC sites "
            "is 14% behind plan. Safety: genital mycotic infections and volume depletion are monitored. "
            "Regulatory strategy: sNDA in US and Type II variation in EU following primary readout."
        ),
    },
    {
        "title": "OncoPrime Biomarker Testing Brief",
        "doc_type": "medical",
        "content": (
            "OncoPrime is a PD-1 combination therapy for NSCLC with PD-L1 >= 50%. "
            "Medical affairs priorities include KOL education on companion diagnostics, "
            "congress abstract mining for AACR/ASCO, and MSL talk tracks on immune-related AEs. "
            "Competitive pressure from Rival-B dual checkpoint regimen. "
            "Evidence gaps: underrepresentation of never-smokers and EGFR mutant subgroups."
        ),
    },
    {
        "title": "ImmunoPath Safety Signal Assessment",
        "doc_type": "safety",
        "content": (
            "ImmunoPath (IL-17 pathway) has an open signal for inflammatory bowel events. "
            "Disproportionality analysis shows EB05 1.8 for colitis. "
            "Actions: enhanced monitoring, DHPC draft, and label language review with PV and Regulatory. "
            "OpenFDA FAERS queries for medicinal product ImmunoPath should be reviewed weekly. "
            "Human-in-the-loop approval required before external communication."
        ),
    },
    {
        "title": "EU HTA Evidence Requirements — HEOR",
        "doc_type": "heor",
        "content": (
            "For EU HTA Joint Clinical Assessment readiness, OncoPrime requires relative effectiveness "
            "vs relevant comparators, subgroup consistency, and quality-of-life instruments (EQ-5D). "
            "Budget impact models should include biomarker testing costs. "
            "NICE and G-BA remain critical markets; ICER below willingness-to-pay thresholds improves access."
        ),
    },
    {
        "title": "FDA RWE Guidance Summary for Regulatory Affairs",
        "doc_type": "regulatory",
        "content": (
            "FDA guidance on real-world evidence supports use of RWD for label expansions when data quality, "
            "provenance, and confounding control are demonstrated. "
            "LSI-OS recommends mapping each RWE study to a fit-for-purpose assessment checklist, "
            "audit trail of transformations, and pre-specified statistical analysis plans. "
            "CMC readiness for CardiaX sNDA currently at 78%."
        ),
    },
]


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        org = db.scalar(select(Organization).where(Organization.slug == "lsi-demo"))
        if not org:
            org = Organization(name="LSI Demo Pharma", slug="lsi-demo", plan="enterprise")
            db.add(org)
            db.flush()

        admin = db.scalar(select(User).where(User.email == "admin@lsi.os"))
        if not admin:
            admin = User(
                org_id=org.id,
                email="admin@lsi.os",
                full_name="Ada Admin",
                hashed_password=hash_password("demo1234"),
                role="admin",
            )
            db.add(admin)
            db.add(
                User(
                    org_id=org.id,
                    email="analyst@lsi.os",
                    full_name="Alex Analyst",
                    hashed_password=hash_password("demo1234"),
                    role="analyst",
                )
            )

        existing_titles = {d.title for d in db.scalars(select(Document).where(Document.org_id == org.id)).all()}
        # apps/api/app/db/seed.py -> repo root is parents[4]
        seed_dir = Path(__file__).resolve().parents[4] / "data" / "seed"
        alt = Path("/app/data/seed")
        if alt.exists():
            seed_dir = alt

        for item in SEED_DOCS:
            if item["title"] in existing_titles:
                continue
            doc = Document(
                org_id=org.id,
                title=item["title"],
                content=item["content"],
                doc_type=item["doc_type"],
                source="seed",
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            ingest_document(db, doc)

        if seed_dir.exists():
            for path in seed_dir.glob("*.txt"):
                title = path.stem.replace("_", " ").title()
                if title in existing_titles:
                    continue
                content = path.read_text(encoding="utf-8")
                doc = Document(org_id=org.id, title=title, content=content, doc_type="general", source="seed-file")
                db.add(doc)
                db.commit()
                db.refresh(doc)
                ingest_document(db, doc)

        wf = db.scalar(select(Workflow).where(Workflow.org_id == org.id, Workflow.name == "Intelligence Brief Pipeline"))
        if not wf:
            db.add(
                Workflow(
                    org_id=org.id,
                    name="Intelligence Brief Pipeline",
                    description="Ingest knowledge, extract trials, analyze KPIs, approve, notify executives.",
                    steps=[
                        {"id": "ingest", "label": "Ingest", "type": "ingest"},
                        {"id": "extract", "label": "Extract Trials", "type": "extract"},
                        {"id": "analyze", "label": "Analyze KPIs", "type": "analyze"},
                        {"id": "approve", "label": "Approve", "type": "approve"},
                        {"id": "notify", "label": "Notify", "type": "notify"},
                    ],
                )
            )
        db.commit()
        print("Seed complete. Demo login: admin@lsi.os / demo1234")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
