# LSI-OS — Life Sciences Intelligence OS

AI-native operating system for pharma, biotech, CRO, and healthcare teams. Combines agentic AI, RAG knowledge, live public data (ClinicalTrials.gov, OpenFDA, PubMed), and domain modules in one workspace.

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 15, React, Tailwind, Framer Motion |
| API | FastAPI, SQLAlchemy, JWT/RBAC |
| Data | SQLite (local) or PostgreSQL + Redis + MinIO (Docker) |
| AI | LLM router (OpenAI / Anthropic / demo brain), RAG, multi-agent tools |

## Quick start (2 terminals)

```bash
# 1) API
cd apps/api
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000

# 2) Web
cd apps/web
npm install
npm run dev
```

Visit **http://localhost:3000**

**Demo login:** `admin@lsi.os` / `demo1234`

## One-command Docker

```bash
docker compose -f infra/docker-compose.yml up --build
```

## Product surfaces

- Marketing: Landing, Solutions, Pricing, Security, Contact
- App: Dashboard, AI Copilot, Agent Studio, Knowledge Hub, Workflows
- Domains: Commercial, Medical Affairs, Clinical, HEOR/RWE, Regulatory, Pharmacovigilance
- Platform: Marketplace, Admin (users/audit/models/usage), Settings

## Optional LLM keys

```bash
set OPENAI_API_KEY=sk-...
# or
set ANTHROPIC_API_KEY=sk-ant-...
```

Without keys, Copilot and agents use the **demo brain** with full retrieval and tool execution.

## Repository layout

```
apps/web      Next.js UI
apps/api      FastAPI + AI platform
infra/       Docker Compose
data/seed/   Seed corpus
docs/        Runbooks
packages/    Shared constants
```

See [docs/RUNBOOK.md](docs/RUNBOOK.md) for operations notes.
