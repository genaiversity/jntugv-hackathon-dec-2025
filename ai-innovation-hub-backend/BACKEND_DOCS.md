# AI Innovation Hub Backend — Documentation

FastAPI backend that orchestrates LLM calls and stores all project phases/artifacts.

This document focuses on **env configuration**, **commands**, and **how the backend fits** into the system.

---

## 1. Overview

The backend exposes a REST API that:

- Manages **projects** and their **phases** (ideation → code_generation → final_spec).
- Calls local or remote **LLMs** to generate structured artifacts.
- Stores everything in a **SQLite** database via SQLModel.
- Supports **versioned artifacts** (multiple variants per artifact type).
- Provides **export endpoints** to build markdown/PDF/DOCX specs.

Core file structure:

```text
ai-innovation-hub-backend/
├── app/
│   ├── __init__.py
│   ├── codegen.py      # File-by-file codegen sessions + ZIP
│   ├── config.py       # Settings and env handling
│   ├── database.py     # SQLite + Session management
│   ├── llm.py          # LLM client (LM Studio / remote OpenAI-compatible)
│   ├── main.py         # FastAPI app & routes
│   ├── models.py       # SQLModel ORM models
│   ├── prompts.py      # Phase-specific prompt templates
│   ├── schemas.py      # Pydantic request/response models
│   └── services.py     # Business logic, phase generation
├── .env.example        # Example environment configuration
├── requirements.txt
└── README.md
```

---

## 2. Environment Configuration

Copy `.env.example` to `.env` and adjust as needed.

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

### 2.1 Variables Explained

- **LM_STUDIO_BASE_URL**
  - Base URL of the LM Studio OpenAI-compatible local server.
  - Default when running the LM Studio local server: `http://localhost:1234/v1`.

- **PRIMARY_MODEL**
  - Main LLM used for product/UX/business content.
  - Example: `mistral-7b-instruct-v0.2`.

- **CODER_MODEL**
  - Model used for technical artifacts and code generation (e.g., `tech_stack`, `api_design`, `project_tasks`, `generated_app`).
  - Example: `qwen2.5-coder-7b-instruct`.
  - If missing, backend can fall back to the primary model.

- **DATABASE_URL**
  - SQLModel connection string.
  - Default: `sqlite:///./innovation_hub.db` (file in project root).

- **DEBUG**
  - Enables extra logging and potentially more verbose error messages.

---

## 3. Prerequisites

- **Python** 3.10+
- **LM Studio** installed and running (for local models):

```bash
# Install LM Studio from the official website

# Download the primary model in LM Studio
# e.g. mistral-7b-instruct-v0.2
```

If you switch to another LLM provider (OpenAI, etc.), update `llm.py` and env accordingly.

---

## 4. Setup & Commands

### 4.1 Create Virtual Environment & Install Deps

```bash
# From the repo root
cd ai-innovation-hub-backend

# Create venv
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4.2 Run LLM + API

Start the LM Studio OpenAI-compatible server (for local models):

1. Open LM Studio.
2. Ensure these models are downloaded:
   - `mistral-7b-instruct-v0.2` (primary)
   - `qwen2.5-coder-7b-instruct` (coder)
3. Start the local server (default URL should match `LM_STUDIO_BASE_URL`).

Then, in another terminal:

```bash
# From the repo root
cd ai-innovation-hub-backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at:

- Swagger UI: `http://localhost:8000/docs`
- Root health/info: `http://localhost:8000/`

---

## 5. Key Endpoints (Cheat Sheet)

### 5.1 Health

```http
GET /health
```

Check API + LLM connectivity.

### 5.2 Projects

```http
POST   /projects                    # Create new project
GET    /projects                    # List all projects
GET    /projects/{id}               # Get project with phases + artifacts
DELETE /projects/{id}               # Delete project & all related data
```

### 5.3 Phases & Generation

```http
GET  /projects/{id}/phases
POST /projects/{id}/phases/{phase_type}/generate
```

`phase_type` in:

- `ideation`
- `concept_design`
- `launch_content`
- `validation`
- `tech_build`
- `code_generation`
- `final_spec`

Example request body:

```json
{
  "regenerate": false,
  "custom_instructions": "Focus on mobile-first approach and student users"
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

Downloads a ZIP file built from the latest `code_generation` output (`generated_app`).
Optionally provide an `artifact_id` in the request body:

```json
{
  "artifact_id": 123
}
```

### 5.7 File-by-file Code Generator (Chat-style)

This workflow avoids relying on a single large multi-file JSON response from the model.
Instead, files are generated and stored one at a time and then zipped.

```http
GET  /projects/{project_id}/codegen/sessions/latest
POST /projects/{project_id}/codegen/sessions
GET  /codegen/sessions/{session_id}
POST /codegen/sessions/{session_id}/generate-file
PUT  /codegen/sessions/{session_id}/files
GET  /codegen/sessions/{session_id}/zip
```

Notes:
- After pulling changes, restart the backend so SQLModel can create the new tables.
- The `generate-file` endpoint prompts the coder model to return only JSON:
  `{ "path": "...", "content": "..." }`.

- **Full project spec (all artifacts, latest versions):**

  ```http
  GET /projects/{id}/export           # JSON { project_id, format, content }
  GET /projects/{id}/export-file     # ?format=markdown|pdf|docx
  ```

- **Final spec (selected variants + latest defaults):**

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

## 6. Integration with Frontend

- Frontend env: `NEXT_PUBLIC_API_URL` should point to this backend, e.g.:

  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

- Frontend calls:
  - `/projects` to list + create
  - `/projects/{id}` to show detail & phases
  - `/projects/{id}/phases/{phase_type}/generate` for generation
  - `/projects/{id}/export*` endpoints for export flows
  - `/projects/{id}/codezip` to download generated starter code as a ZIP (phase-based)
  - File-by-file codegen (chat-style):
    - `/projects/{id}/codegen/sessions/latest`
    - `/projects/{id}/codegen/sessions`
    - `/codegen/sessions/{session_id}`
    - `/codegen/sessions/{session_id}/generate-file`
    - `/codegen/sessions/{session_id}/files`
    - `/codegen/sessions/{session_id}/zip`

---

## 7. Troubleshooting

- **LLM connection errors**
  - Check `LM_STUDIO_BASE_URL` and that the LM Studio local server is running.
  - Confirm the correct model is downloaded and selected in LM Studio.

- **Database issues**
  - Delete `innovation_hub.db` if schema changed and you want a clean slate.
  - Ensure the app has write permissions in the project directory.

- **Slow generations**
  - Models may be large; consider a smaller model or running on a stronger machine.
  - Reduce prompt size or number of artifacts per phase in `prompts.py` / `services.py`.
