# EIOS Deployment

Two primary paths: **Docker Compose** for full local/staging stack, and **Vercel** for the web app.

## Docker Compose (full stack)

From the repository root:

```bash
docker compose -f infra/docker-compose.yml up --build
```

### Production profile

```bash
export JWT_SECRET=replace-me
export OPENAI_API_KEY=sk-...
docker compose -f infra/docker-compose.yml -f infra/docker-compose.prod.yml --profile prod up -d --build
```

Prod overlay adds `restart: unless-stopped`, healthchecks, and SMTP/OpenAI wiring. See `infra/docker-compose.prod.yml`.

### Services

| Service | Port | Description |
|---------|------|-------------|
| `web` | 3000 | Next.js (`apps/web`) |
| `api` | 4000 | Nest platform API (`apps/api-nest`) |
| `ai` | 8000 | Python AI service (`apps/ai`, uvicorn) |
| `postgres` | 5432 | pgvector |
| `redis` | 6379 | Cache / queues |
| `minio` | 9000 / 9001 | Object storage (console on 9001) |

### Environment

Copy `.env.example` to `.env` at the repo root. Key variables:

```bash
OPENAI_API_KEY=          # optional for demo; required for production LLM
JWT_SECRET=              # change in production
DATABASE_URL=postgresql://eios:eios_secret@postgres:5432/eios
AI_SERVICE_URL=http://ai:8000
NEST_API_URL=http://api:4000
```

Compose wires service URLs internally. For connector production sync, add vendor keys (`HUBSPOT_API_KEY`, `STRIPE_SECRET_KEY`, etc.).

### Build contexts

- `api` → `apps/api-nest/Dockerfile`
- `ai` → `apps/ai/Dockerfile` (`uvicorn app.main:app --host 0.0.0.0 --port 8000`)
- `web` → `apps/web/Dockerfile`

### Legacy note

`apps/api` is the legacy Python API. It is **not** started by default Compose; use `apps/ai` for the AI service.

## Vercel (web only)

The Next.js app can deploy to Vercel without the full Docker stack.

### Project settings

- **Root directory:** `apps/web`
- **Framework:** Next.js (auto-detected)
- **Build command:** `npm run build` (or monorepo build from root)
- **Output:** default Next.js

`apps/web/vercel.json` sets `maxDuration: 60` for the `/api/v1` route handler.

### Environment variables (Vercel dashboard)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes* | Platform API URL (Nest or proxy target) |
| `OPENAI_API_KEY` | For LLM | Cloud synthesis / embeddings in API routes |
| `JWT_SECRET` | Yes | Must match platform API for auth |

\* If unset, the web app can use same-origin `/api/v1` handlers when API routes are bundled with the Next app.

### Hybrid production layout

Typical production:

1. **Vercel** — `apps/web` (UI + optional edge API routes)
2. **VPC / cloud** — `apps/api-nest`, `apps/ai`, Postgres, Redis, MinIO via Docker or managed services
3. Point `NEXT_PUBLIC_API_URL` at the Nest API public URL

### npm scripts (local dev without Docker)

```bash
npm run dev:web    # Next.js on :3000
npm run dev:api    # Nest API on :4000
npm run dev:ai     # uvicorn on :8000
npm run docker:up  # full Compose stack
```

Demo login: `admin@lsi.os` / `demo1234`
