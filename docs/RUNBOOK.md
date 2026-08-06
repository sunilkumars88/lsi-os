# LSI-OS Runbook

## Local (fastest)

```bash
# API
cd apps/api
python -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Web (new terminal)
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 — login `admin@lsi.os` / `demo1234`.

## Docker full stack

```bash
docker compose -f infra/docker-compose.yml up --build
```

- Web: http://localhost:3000
- API docs: http://localhost:8000/docs
- MinIO console: http://localhost:9001

## LLM keys (optional)

Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in the environment. Without keys, the demo brain still answers using RAG + tools.
