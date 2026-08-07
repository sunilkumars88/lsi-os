# Enterprise Intelligence OS (EIOS)

AI-native **Enterprise Intelligence Operating System** — not a ChatGPT wrapper.

Connect enterprise systems, ground answers in governed knowledge, orchestrate agents with human approvals, and run industry packs (Life Sciences first).

## Why it beats a general LLM

A general LLM can summarize a paper. EIOS can retrieve approved content, pull live clinical/safety sources, check permissions, run multi-step agents, require approvals, assign follow-ups, and write audit trails inside a tenant.

| Layer | Role |
|-------|------|
| L5 | Customer private intelligence |
| L4 | Industry packs |
| L3 | Proprietary OS intelligence (ontology, workflows, agents) |
| L2 | Multi-LLM router |
| L1 | Cloud, security, data platform |

## Quick start

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 — demo `admin@lsi.os` / `demo1234`

## Core OS modules

Command Center · Intelligence Copilot · Agent Runtime · Workflow Engine · Human Approvals · Enterprise Memory · Knowledge Graph · Data Rights Registry · Integration Hub · Model Router · Industry Packs · Marketplace · Governance

## Life Sciences pack (active)

Commercial · Medical Affairs · Clinical · HEOR/RWE · Regulatory · Pharmacovigilance

## Data strategy

Data Rights Registry with GREEN / BLUE / YELLOW / RED zones. Government/open APIs for retrieval. Customer data tenant-isolated. Do not train on unclear rights.

## Deploy

Vercel hosts the Next.js app (UI + same-origin `/api/v1`). Optional `OPENAI_API_KEY` for cloud synthesis/embeddings.
