# AI Innovation Hub Backend

FastAPI backend that transforms raw ideas into validated mini‑startup concepts using local LLMs (Llama 3.1 / Qwen2.5 Coder or similar models).

This repository exposes the REST API used by the Next.js frontend.

---

## 1. Features

- **7 Phases of Idea Development**
  1. **Ideation** – Problem statement, personas, idea variants
  2. **Concept Design** – Feature list, user flows
  3. **Launch Content** – Landing page copy, pitch outline, taglines
  4. **Validation** – Experiment plans, survey questions, metrics
  5. **Tech Build** – Tech stack, API design, project tasks
  6. **Code Generator** – Generate a runnable multi-file starter application
  7. **Final Spec** – Complete project specification

- **File-by-file Code Generator (Recommended for local LLM context limits)**
  - Generate and store code one file at a time (chat-style)
  - Edit/save files server-side
  - Download a ZIP from the stored files

- **LLM Orchestration**
  - Primary model for product/business/UX content
  - Optional coder model for tech‑heavy artifacts (stack, APIs, tasks)

- **Persistence & Versioning**
  - All phases and artifacts stored in SQLite via SQLModel
  - Regeneration creates new **versions** per artifact type

- **Export**
  - Full project spec (all artifacts, latest versions) as Markdown / PDF / DOCX
  - Final spec built from **user‑selected variants** + latest defaults for others

For a deeper dive (env vars, architecture, endpoint details), see `BACKEND_DOCS.md`.

Quality/safety layers:
- Guardrails & evals documentation: `GUARDRAILS_AND_EVALS.md`

---

## 2. Prerequisites

1. **Python 3.10+**
2. **LM Studio** running locally with an OpenAI-compatible server and models (default setup):
   - `mistral-7b-instruct-v0.2` as the primary model for product/business content
   - `qwen2.5-coder-7b-instruct` as the coder model for technical artifacts and code generation

### 2.1 Configure LM Studio

1. Install LM Studio from the official site.
2. In LM Studio, download:
   - `mistral-7b-instruct-v0.2` (primary)
   - `qwen2.5-coder-7b-instruct` (coder)
3. Start the **OpenAI-compatible local server** (default: `http://localhost:1234/v1`).

---

## 3. Configuration

Copy `.env.example` to `.env` and edit as needed:

```env
# LLM Configuration (LM Studio OpenAI-compatible server)
LM_STUDIO_BASE_URL=http://localhost:1234/v1
PRIMARY_MODEL=mistral-7b-instruct-v0.2
CODER_MODEL=qwen2.5-coder-7b-instruct

# Database
DATABASE_URL=sqlite:///./innovation_hub.db

# App Settings
DEBUG=true
```

Variable meanings and more context are in `BACKEND_DOCS.md`.

---

## 4. Setup & Run

### 4.1 Install Dependencies

```bash
# From the repo root
cd ai-innovation-hub-backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4.2 Start LLM + API

```bash
# Terminal 1: start LM Studio OpenAI-compatible server
# (In LM Studio UI, start the local server; default URL: http://localhost:1234/v1)

# Terminal 2: start FastAPI
# From the repo root
cd ai-innovation-hub-backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at:

- Swagger UI: `http://localhost:8000/docs`
- Root: `http://localhost:8000/`

---

## 5. Core Endpoints (Summary)

### 5.1 Health

```http
GET /health
```

Check API and LLM status.

### 5.2 Projects

```http
POST   /projects                    # Create new project
GET    /projects                    # List all projects
GET    /projects/{id}               # Get project with phases + artifacts
DELETE /projects/{id}               # Delete project and related data
```

### 5.3 Phases & Generation

```http
GET  /projects/{id}/phases
POST /projects/{id}/phases/{phase_type}/generate
```

`phase_type` ∈ {`ideation`, `concept_design`, `launch_content`, `validation`, `tech_build`, `code_generation`, `final_spec`}.

Example body:

```json
{
  "regenerate": false,
  "custom_instructions": "Focus on mobile-first approach"
}
```

### 5.4 Artifacts

```http
GET /projects/{id}/artifacts   # List all artifacts for a project
GET /artifacts/{id}            # Get a single artifact
```

### 5.5 Export

### 5.6 Code Generator ZIP (Phase-based)

```http
POST /projects/{id}/codezip
```

Downloads a ZIP generated from the latest `code_generation` output (`generated_app`). Optionally provide an `artifact_id` to download a specific version.

### 5.7 File-by-file Code Generator ZIP (Chat-style)

This flow avoids requiring the model to emit one perfect, large multi-file JSON response.

```http
GET  /projects/{project_id}/codegen/sessions/latest
POST /projects/{project_id}/codegen/sessions
GET  /codegen/sessions/{session_id}
POST /codegen/sessions/{session_id}/generate-file
PUT  /codegen/sessions/{session_id}/files
GET  /codegen/sessions/{session_id}/zip
```

Notes:
- Restart the backend after updating to ensure the new tables are created (SQLite via SQLModel `create_all`).
- `generate-file` prompts the coder model to return a small JSON payload with exactly `{path, content}`.

- **Full spec (all artifacts, latest versions)**

  ```http
  GET /projects/{id}/export            # JSON { project_id, format, content }
  GET /projects/{id}/export-file       # ?format=markdown|pdf|docx
  ```

- **Final spec (selected variants + latest defaults)**

  ```http
  POST /projects/{id}/export-custom
  ```

  Example body:

  ```json
  {
    "artifact_ids": [12, 25, 37],
    "format": "pdf"
  }
  ```

---

## 6. Project Structure

```text
ai-innovation-hub-backend/
├── app/
│   ├── __init__.py
│   ├── codegen.py      # File-by-file codegen session + ZIP logic
│   ├── config.py       # Settings and environment
│   ├── database.py     # SQLite setup
│   ├── llm.py          # LLM wrapper (LM Studio / other OpenAI-compatible providers)
│   ├── main.py         # FastAPI app and endpoints
│   ├── models.py       # SQLModel database models
│   ├── prompts.py      # Phase-specific prompt templates
│   ├── schemas.py      # Pydantic request/response schemas
│   └── services.py     # Business logic (phase generation, exports)
├── .env.example        # Sample env configuration
├── requirements.txt
└── README.md
```

Tip: from the repo root you can also run `run_all.bat` to start backend + frontend in separate terminals (LM Studio still needs to be started manually).

---

## 7. Notes & Next Steps

- The backend is designed to be **resource‑aware**:
  - Only one model is called per request.
  - Coder model is used only for tech‑specific artifacts.
- All state lives in SQLite; LLMs themselves are stateless.

Possible future backend enhancements:

1. Vector search (e.g. ChromaDB) for richer project context.
2. Auth + multi‑user projects.
3. Rate limiting and usage analytics.
4. Pluggable LLM providers (OpenAI/Azure/Anthropic) via config only.
