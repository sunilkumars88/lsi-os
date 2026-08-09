# EIOS Build Status

Production build checklist for branch `cursor/eios-production-build-9a3d`.

Status values: **Done** (in code), **Partial** (core shipped, fidelity deferred), **Needs account** (blocked on your credentials / vendor accounts), **Deferred** (intentionally later).

## Phase checklist

| Phase | Deliverable | Status | Owner | Notes |
|-------|-------------|--------|-------|-------|
| 0 | Turborepo + workspaces + Prettier | Done | code | `turbo.json`, root workspaces |
| 0 | NestJS API scaffold (`apps/api-nest`) | Done | code | Auth, RBAC, modules, seed |
| 0 | AI service (`apps/ai`) OpenAI-only | Done | code | Pack agents, embeddings, `/agents/run` |
| 0 | Shared packages + connectors | Done | code | types/sdk + SF/HubSpot/Stripe/Razorpay/Slack/Email |
| 0 | Docker Compose + CI | Done | code | `infra/docker-compose.yml` + prod overlay; `.github/workflows/ci.yml` smoke |
| 1 | JWT access/refresh, magic-link routes | Done | code | SMTP console fallback until SMTP set |
| 1 | Google/Microsoft OAuth routes | Partial | account | Routes ready; need Client IDs |
| 1 | RBAC Admin/Manager/Operator/Viewer | Done | code | Guards + seed roles |
| 1 | Org/Workspace/invitations | Done | code | Nest modules |
| 1 | Immutable audit logs + export | Done | code | API + Admin UI |
| 1 | Seed `admin@lsi.os` / `demo1234` | Done | code | |
| 2 | Memory ingest PDF/CSV/JSON | Done | code | Multipart upload + text extract; MinIO/local object store |
| 2 | Chunk 512 + 20% overlap + embeddings | Done | code | OpenAI or hash fallback |
| 2 | Hybrid search + citations | Done | code | Vector + keyword fusion (pgvector SQL deferred to Postgres deploy) |
| 2 | Eyes connectors connect/test/sync/disconnect | Done | code | Sandbox adapters; live vendors Needs account |
| 2 | Hands DAG engine + approval pause | Done | code | sequential/parallel/condition/approval/agent/connector |
| 2 | Workflow canvas UI v1 | Done | code | Web workflows page |
| 2 | Governance compliance API + docs | Done | code | SOC2/GDPR/DPDP/CDSCO/RBI/IRDAI |
| 2 | Data-rights zones API + UI | Done | code | |
| 3 | Life Sciences pack agents/workflows/pricing | Done | code | ₹50k / ₹2L / ₹5L+ |
| 3 | Banking pack | Done | code | Loan, fraud, AML/KYC, support |
| 3 | Insurance pack + IRDAI messaging | Partial | code | Agents/workflows Done; production IRDAI templates Needs account |
| 3 | Pack consoles wired to Nest + AI | Done | code | Nest when `NEXT_PUBLIC_API_URL` set; BFF fallback |
| 3 | Marketing / pricing / solutions GTM | Done | code | |
| 4 | Health + readiness probes | Done | code | `/health`, `/api/v1/ready` |
| 4 | Rate limits + structured logs | Done | code | Throttler + JSON logger |
| 4 | CI smoke (auth/RAG/agent/workflow/pack) | Done | code | `smoke-nest.mjs` in CI |
| 4 | Deployment guide + Compose prod profile | Done | code | `docs/deployment.md`, `docker-compose.prod.yml` |
| 4 | Settings: OpenAI probe, connector creds, SMTP | Done | code | |
| 4 | Remove Anthropic | Done | code | OpenAI-only routers; RUNBOOK cleaned |
| 4 | Valid OpenAI key in prod | Done | account | Live on Vercel — gpt-4o-mini + embeddings |
| 4 | SMTP for magic link / invites | Needs account | account | Console provider until SMTP set |
| 4 | Live connector OAuth/API keys | Needs account | account | Sandbox connectors live without keys |
| 4 | AWS RDS/S3/ECS migration | Deferred | account | Compose maps 1:1 when AWS ready |
| 4 | Vercel web deploy | Done | code | https://web-delta-amber-30.vercel.app (BFF + OpenAI) |
| 4 | Nest/AI hosted API | Partial | account | In repo + Compose; Vercel serves BFF parity aliases |

## Connector key matrix

| Connector | Sandbox (no keys) | Production |
|-----------|-------------------|------------|
| Salesforce | Done | Needs account — `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET` |
| HubSpot | Done | Needs account — `HUBSPOT_API_KEY` |
| Stripe | Done | Needs account — `STRIPE_SECRET_KEY` |
| Razorpay | Done | Needs account — `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Slack | Done | Needs account — `SLACK_BOT_TOKEN` |
| Email | Done | Needs account — `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` |

## Service map

| Path | Role |
|------|------|
| `apps/web` | Next.js frontend + optional same-origin BFF |
| `apps/api-nest` | Primary platform API (NestJS, port 4000) |
| `apps/ai` | AI service — agents, RAG, embeddings (port 8000) |
| `apps/api` | Legacy Python API — retained, not Compose default |
| `packages/connectors/*` | Connector SDKs (sandbox-first) |

## What you must provide

1. Valid `OPENAI_API_KEY`
2. SMTP (Resend/SendGrid/Gmail app password)
3. Optional OAuth: Google + Microsoft
4. Optional connector vendor credentials
5. Optional later: AWS account for managed Postgres/S3/ECS

_Last updated: production build on `cursor/eios-production-build-9a3d`._
