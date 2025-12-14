# AI Innovation Hub — Your AI Co‑Founder for Early‑Stage Ideas

A GenAI platform that converts rough ideas into validated mini‑startups in minutes.

This repository contains the **frontend** (Next.js) for AI Innovation Hub. The backend lives in a separate repo and is required for full functionality.

---

## 1. What This Project Does

Students, early-stage founders, and hackathon teams often start with **vague ideas** and no clear path to a buildable product. AI Innovation Hub:

- Refines rough ideas into a clear **problem statement**.
- Generates **personas**, **feature lists**, and **solution concepts**.
- Produces **launch content** (landing page copy, pitch outline, taglines).
- Designs **validation experiments**, survey questions, and success metrics.
- Suggests a **tech stack** and high-level architecture.
- Generates a runnable **starter application** (multi-file) and downloads it as a ZIP.
- Exports everything as a **mini‑startup blueprint** (Markdown / PDF / DOCX).

This frontend provides the interactive dashboard and multi‑phase workspace on top of the FastAPI backend.

---

## 2. Repos & Documentation

- **Frontend (this repo)**
  - `README.md` – you are here.
  - `FRONTEND_DOCS.md` – detailed env + commands and route mapping.
  - `PROJECT_DOCUMENTATION.md` – high‑level, hackathon‑facing overview.
  - `PRESENTATION_OUTLINE.md` – slide‑by‑slide pitch deck outline.

- **Backend**
  - Lives in this repo under `ai-innovation-hub-backend/`
  - See `ai-innovation-hub-backend/BACKEND_DOCS.md` for env, commands, and endpoints.

Tip: from the repo root you can run `run_all.bat` to start backend + frontend in separate terminals (LM Studio still needs to be started manually).

---

## 3. Environment Setup (Frontend)

Create a local env file based on the example:

```bash
# From the repo root
cd ai-innovation-hub-frontend
copy .env.example .env.local
```

`.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Update `NEXT_PUBLIC_API_URL` if your backend is running on a different host/port.

---

## 4. Install & Run

From the frontend repo root:

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open:

- Frontend UI: `http://localhost:3000`
- Backend API (separate process): `http://localhost:8000`

### Production build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## 5. Key Screens

- `/` – **Projects dashboard**
  - Lists all projects (ideas) from the backend.
  - Create new, open existing, or delete.

- `/new` – **New Project**
  - Form for idea description, user type, constraints, skills, time available.
  - On submit, creates a backend project and redirects to `/projects/[id]`.

- `/projects/[id]` – **Project Workspace**
  - Phase progress (Ideation → Code Generator → Final Spec).
  - Tabs per phase with generate/regenerate actions.
  - Accordion view of artifacts rendered as markdown.
  - Code Generator tab supports:
    - Phase-based multi-file generation + ZIP download
    - Link to the file-by-file generator (recommended if your local model hits context limits)

- `/projects/[id]/codegen` – **File-by-file Code Generator**
  - Generate one file at a time (chat-style) and save/edit
  - Download ZIP from the stored files
  - Radio controls to mark which artifact variants to use in the **final spec**.
  - Export buttons:
    - Full spec (`.md`, PDF, DOCX)
    - Final spec using selected variants (`.md`, PDF, DOCX)

---

## 6. Tech Stack

- **Framework:** Next.js 16 (App Router) + React
- **UI:** Tailwind CSS + custom animations (gradient header, card hover, AI loader)
- **Components:** Radix UI primitives + custom `ui` components
- **Markdown Rendering:** `react-markdown` + `remark-gfm`
- **Type System:** TypeScript

For backend technologies, see the backend README / `BACKEND_DOCS.md`.
