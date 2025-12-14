# AI Innovation Hub — Project Documentation

Your AI co‑founder for early‑stage ideas.

This document is the main overview for judges/contributors: what the project does, how it works, and how to run it end‑to‑end.

---

## 1. Problem Statement

Students, early-stage founders, and hackathon participants often begin with raw, unstructured ideas but lack the experience to convert them into clear, validated, and buildable product concepts. They struggle with defining user personas, shaping solution directions, prioritizing feature sets, and preparing early assets like landing-page content, pitches, or workflow diagrams. As a result, teams waste time, lose clarity, and fail to move ideas toward implementation.

While individual AI tools exist for writing, summarizing, or diagram generation, there is no unified system that transforms a vague idea into a validated, actionable mini-startup blueprint. There is no automated workflow that handles ideation, feasibility evaluation, tech-stack guidance, and experiment planning in one place—especially for beginners who lack product thinking, technical mentorship, or startup experience.

**Core question:**

> How can we use Generative AI and agentic workflows to help novices turn rough ideas into validated, structured, and testable mini-startup concepts—quickly, consistently, and without expert supervision?

---

## 2. High‑Level Solution Overview

**AI Innovation Hub** is a GenAI platform that behaves like an AI co‑founder for beginners:

- Converts raw, messy ideas into a clear **problem statement** and assumptions.
- Generates detailed **user personas**, use‑cases, and value propositions.
- Produces multiple **solution concepts and feature sets**, with prioritization.
- Creates **launch content**: landing page copy, pitch outline, and taglines.
- Designs **validation experiments**, survey questions, and success metrics.
- Suggests a **tech stack and rough system design** aligned with the user’s skills/constraints.
- Uses an **agentic workflow** (PM agent, Tech agent, Reviewer agent) to refine outputs.
- Generates a runnable **starter application** and supports ZIP download via:
  - Phase-based multi-file generation (single large JSON response)
  - File-by-file code generation (chat-style, more reliable with local LLM context limits)
- Exports a **single mini‑startup blueprint** as Markdown, PDF, or DOCX.

---

## 3. System Architecture (Conceptual)

```text
[User Idea + Context]
          |
          v
   [PM / Product Agent]
          |
          v
   [Tech / Builder Agent]
          |
          v
   [Reviewer / Critic Agent]
          |
          v
 [Mini‑Startup Blueprint]
 (Personas, Features, LP copy,
  Experiments, Tech Stack, Spec)
```

### 3.1 Components

- **User Interface (Next.js Frontend)**
  - Collects idea, constraints, skills, and time‑available.
  - Shows progress across phases and renders AI outputs as rich markdown.
  - Lets the user **regenerate phases**, view multiple artifact versions, and
    select which variants to include in a final spec.

- **FastAPI Backend**
  - Provides REST endpoints for:
    - Project creation/listing/deletion
  - Phase generation (ideation → code generation → final spec)
    - Artifact retrieval
    - Export (full spec and user‑selected "final" spec)
  - Persists all phases and artifacts in SQLite.

- **Agents / Services**
  - **PM Agent**: problem statement, personas, idea variants.
  - **Concept Agent**: feature list, user flows.
  - **Launch Agent**: landing page copy, pitch outline, taglines.
  - **Validation Agent**: experiments, surveys, metrics.
  - **Tech Agent**: tech stack, API design, build plan.
  - **Code Generator Agent**: generates a runnable multi-file starter application.
  - **Final Spec Agent**: composes an end‑to‑end specification.

- **LLM Layer**
  - Primary model for product/UX content.
  - Optional coder model for technical/structure‑heavy outputs.

- **Export Layer**
  - Builds a project‑level markdown document.
  - Converts markdown → PDF / DOCX while preserving headings and lists.
  - Supports exporting:
    - Entire history/spec
    - A curated "final" spec based on selected variants.

---

## 4. Repos & Structure

- **Backend** (FastAPI + SQLite + local LLMs)
  - Location: `ai-innovation-hub-backend/`
  - Core file: `ai-innovation-hub-backend/app/main.py` (FastAPI app and endpoints)
  - See `ai-innovation-hub-backend/BACKEND_DOCS.md` for full setup and env.

- **Frontend** (Next.js + Tailwind UI)
  - Location: `ai-innovation-hub-frontend/`
  - Routes:
    - `/` – Dashboard of projects
    - `/new` – Create new project (idea entry form)
    - `/projects/[id]` – Multi‑phase AI workspace for a single project
    - `/projects/[id]/codegen` – File-by-file code generator (generate/save files, download ZIP)
  - See `ai-innovation-hub-frontend/FRONTEND_DOCS.md` for env and commands.

Convenience: run `run_all.bat` from the repo root to start backend + frontend in separate terminals (LM Studio still needs to be started manually).

---

## 5. End‑to‑End Flow (Judge‑Friendly)

1. **User enters an idea** on `/new`:
   - Name, description, user type, constraints, skills, time available.
2. Backend creates a **project** and initializes all **phases**.
3. On `/projects/[id]`, the user steps through:
   - Ideation → Concept Design → Launch Content → Validation → Tech Build → Code Generator → Final Spec.
   - Each phase calls the backend to generate structured artifacts via LLMs.
4. For each artifact type (e.g. `idea_variants`, `full_spec`) the system can
   store multiple **versions** (regenerations).
5. In the UI, the user selects which **variant** to "Use in final" for key
   sections (e.g. final problem statement, preferred feature set).
6. When ready, the user exports:
   - **Code ZIP** (generated starter app as a ZIP)
     - Phase-based: generated from the `code_generation` phase output
     - File-by-file: generated from stored files in `/projects/[id]/codegen`
   - **Full Spec** (all artifacts, latest versions) or
   - **Final Spec** (user‑selected variants + latest versions for the rest)
   as **Markdown / PDF / DOCX**.

---

## 6. High‑Level Setup Summary

> Full details are in `BACKEND_DOCS.md` (backend) and `FRONTEND_DOCS.md` (frontend).

### 6.1 Backend (Summary)

- Requirements: Python 3.10+, **LM Studio** running an OpenAI-compatible local server.
- Example models:
  - `PRIMARY_MODEL=mistral-7b-instruct-v0.2`
  - `CODER_MODEL=qwen2.5-coder-7b-instruct`
- Key env vars (from `.env`):
  - `LM_STUDIO_BASE_URL=http://localhost:1234/v1`
  - `PRIMARY_MODEL=mistral-7b-instruct-v0.2`
  - `CODER_MODEL=qwen2.5-coder-7b-instruct`
  - `DATABASE_URL=sqlite:///./innovation_hub.db`
  - `DEBUG=true`
- Core commands:

```bash
# From the repo root
cd ai-innovation-hub-backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6.2 Frontend (Summary)

- Requirements: Node.js 18+.
- Env file: `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- Core commands:

```bash
# From the repo root
cd ai-innovation-hub-frontend
npm install
npm run dev      # start dev server on http://localhost:3000
npm run build    # create production build
npm start        # start production server
npm run lint     # run ESLint
```

---

## 7. Evaluation, Limitations & Future Work

### 7.1 Evaluation & Limitations

- LLM outputs are **assistive**, not authoritative; human review is required.
- Persona and feature quality depends heavily on **clarity of input idea**.
- Technical feasibility checks are **high‑level**, not a full architecture review.
- No real‑time collaboration or multi‑user editing in the current MVP.
- Long‑context projects may be truncated depending on LLM context limits.
  - Mitigation: use the file-by-file code generator route to keep model outputs small.

### 7.2 Future Improvements

- Auto‑generate Figma‑style wireframes from specs.
- GitHub issue generator from the final spec (tasks/backlog).
- Real‑time collaboration for teams.
- Domain‑specific prompt packs (FinTech, EdTech, HealthTech, etc.).
- Multi‑language support for problem statements and launch content.

---

## 8. Demo Checklist for Judges

When recording your demo or doing a live run:

1. Show the problem statement (why this exists).
2. Enter a rough idea and constraints.
3. Walk through 2–3 phases (Ideation, Launch Content, Tech Build).
4. Show multiple variants and how you pick the final ones.
5. Export the final spec as Markdown/PDF and scroll through it.
6. Close with how this helps students/founders move faster.
