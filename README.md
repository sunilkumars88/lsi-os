# EIOS — Enterprise Intelligence Operating System

**Tagline:** Connect. Understand. Automate. Govern.

Production monorepo implementing the EIOS technical guide, build checklist, and market adoption strategy — **OpenAI only** (no Anthropic).

## Architecture

| Service | Path | Port | Role |
|---------|------|------|------|
| Web | `apps/web` | 3000 | Next.js UI + optional same-origin BFF |
| API | `apps/api-nest` | 4000 | NestJS platform API (auth, tenants, knowledge, connectors, workflows, packs, billing) |
| AI | `apps/ai` | 8000 | FastAPI agents, RAG tools, pack agents |
| Legacy API | `apps/api` | — | Retained for compatibility; not default in Compose |

Data: Postgres 16 + pgvector, Redis 7, MinIO (S3-compatible).

## Quick start

```bash
cp .env.example .env
# Set OPENAI_API_KEY for production LLM

# Full stack (requires Docker)
npm run docker:up

# Or local services
npm run dev:api    # Nest on :4000
npm run dev:ai     # FastAPI on :8000
npm run dev:web    # Next on :3000
```

Demo login: `admin@lsi.os` / `demo1234`

## Industry packs

- **Life Sciences** — Trial coordinator, safety monitor, protocol compliance, regulatory docs (₹50k / ₹2L / ₹5L+ per month)
- **Banking** — Loan origination, fraud, AML/KYC, support
- **Insurance** — Claims triage, underwriting, SIU

## What you must configure

See [docs/BUILD_STATUS.md](docs/BUILD_STATUS.md) and [.env.example](.env.example):

1. Valid `OPENAI_API_KEY`
2. SMTP / Resend for magic links & invites
3. Optional OAuth (Google / Microsoft)
4. Optional live connector keys (Salesforce, HubSpot, Stripe, Razorpay, Slack)
5. Optional AWS for managed RDS/S3/ECS (Compose maps 1:1)

Sandbox connectors work without vendor keys.

## Docs

- [Deployment](docs/deployment.md)
- [Build status](docs/BUILD_STATUS.md)
- [Compliance stubs](docs/compliance/)
