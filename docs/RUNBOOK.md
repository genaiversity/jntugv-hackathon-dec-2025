# Runbook

This runbook consolidates the most important operational steps from the existing docs:
- `ai-innovation-hub-backend/BACKEND_DOCS.md`
- `ai-innovation-hub-frontend/FRONTEND_DOCS.md`

It is intended to be copy/paste-friendly for reviewers.

## 1. Prerequisites

- Python 3.10+
- Node.js 18+
- LM Studio (or another OpenAI-compatible LLM server)

## 2. Backend run (FastAPI)

From repo root:

```bash
cd ai-innovation-hub-backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:
- API root: `http://localhost:8000/`
- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

### 2.1 Backend configuration

Copy env file:

```bash
cd ai-innovation-hub-backend
copy .env.example .env   # Windows
```

Key variables:
- `LM_STUDIO_BASE_URL` (default in docs: `http://localhost:1234/v1`)
- `PRIMARY_MODEL`
- `CODER_MODEL`
- `DATABASE_URL` (default: `sqlite:///./innovation_hub.db`)
- `DEBUG`

Guardrails (optional):
- `ENABLE_GUARDRAILS` (default: true)
- `MAX_GENERATED_FILES`
- `MAX_FILE_CHARS`
- `MAX_TOTAL_CHARS`

## 3. Frontend run (Next.js)

From repo root:

```bash
cd ai-innovation-hub-frontend
npm install
npm run dev
```

Frontend URL:
- `http://localhost:3000`

### 3.2 Notes on the Spline hero background (landing page)

The landing page (`/`) renders a Spline 3D scene via `@splinetool/react-spline` and loads a `.splinecode` scene from a hosted URL.

If you are running fully offline (no external network access), you can temporarily disable the hero by removing the `SplineHero` usage in `ai-innovation-hub-frontend/src/app/page.tsx`.

### 3.1 Frontend configuration

Create `.env.local`:

```bash
cd ai-innovation-hub-frontend
copy .env.example .env.local   # Windows
```

Set:
- `NEXT_PUBLIC_API_URL=http://localhost:8000`

## 4. One-command run (Windows)

From repo root:

```bat
run_all.bat
```

This starts backend and frontend in separate terminals.

## 5. Running tests (backend)

```bash
cd ai-innovation-hub-backend
pytest -q
```

## 6. Optional live eval smoke test

This requires backend + LLM to be running:

```bash
cd ai-innovation-hub-backend
python -m app.evals_live
```

## 7. Troubleshooting

### 7.1 LLM connectivity errors

- Verify LM Studio server is running.
- Confirm `LM_STUDIO_BASE_URL` matches the running server.
- Check `/health` to see LLM status and model list.

### 7.2 Code generation ZIP errors

If `/projects/{id}/codezip` returns “Could not parse/validate generated JSON”:
- The model output likely violated the strict JSON schema.
- Regenerate the `code_generation` phase.
- Prefer the file-by-file codegen route if local model context is limited.

### 7.3 Database issues

- If schema changes and you want a clean slate, delete `innovation_hub.db`.
- Ensure write permissions in the backend directory.

## 8. Quick verification checklist (for demo/review)

- `GET /health` returns LLM online
- Create project in UI
- Generate `ideation` and `tech_build`
- Export full spec
- Generate code and download ZIP
- Run `pytest -q`
