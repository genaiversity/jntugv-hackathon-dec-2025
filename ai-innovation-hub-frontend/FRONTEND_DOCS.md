# AI Innovation Hub Frontend — Documentation

Next.js (App Router) frontend for exploring and managing AI‑generated startup blueprints.

This document focuses on **env setup**, **commands**, and how the UI maps onto the backend.

---

## 1. Overview

The frontend provides:

- A **dashboard** of projects (ideas you are exploring).
- A **New Project** form to enter idea, constraints, skills, and time.
- A **multi‑phase workspace** for each project (`/projects/[id]`):
  - Shows progress across phases (Ideation → Code Generator → Final Spec).
  - Lets you generate/regenerate each phase via the backend.
  - Renders AI outputs as rich markdown with subtle animations.
  - Lets you select which artifact variants to include in a **final spec**, then
    export as Markdown/PDF/DOCX.

---

## 2. Environment Configuration

All frontend configuration is done via `.env.local` (for local dev).

### 2.1 Create `.env.local`

Use the provided example as a base:

```bash
# From the repo root
cd ai-innovation-hub-frontend
copy .env.example .env.local
```

` .env.example` content:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Update `NEXT_PUBLIC_API_URL` if your backend runs on a different host/port.

### 2.2 Variables Explained

- **NEXT_PUBLIC_API_URL**
  - Base URL of the FastAPI backend.
  - Used by the frontend API client (`src/lib/api.ts`) for all requests.
  - Must be accessible from the browser (e.g. `http://localhost:8000`).

---

## 3. Install & Commands

### 3.1 Install Dependencies

```bash
# From the repo root
cd ai-innovation-hub-frontend
npm install
```

### 3.2 Run in Development

```bash
npm run dev
```

- Starts Next.js dev server on `http://localhost:3000`.
- Hot reloads as you edit files in `src/`.

### 3.3 Build & Start (Production)

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

### 3.4 Lint

```bash
npm run lint
```

Runs ESLint using `eslint.config.mjs` and Next.js rules.

---

## 4. App Structure

High‑level layout:

```text
src/
├── app/
│   ├── layout.tsx        # Root layout (header, footer, global styles)
│   ├── globals.css       # Tailwind, custom CSS variables & animations
│   ├── page.tsx          # Project dashboard (list of projects)
│   ├── new/page.tsx      # New project form
│   └── projects/[id]/
│       ├── page.tsx          # Single project view (phases, artifacts, export)
│       └── codegen/page.tsx  # File-by-file code generator (chat-style)
├── components/
│   ├── ui/               # Reusable UI components (Button, Card, Tabs, etc.)
│   └── ...
├── lib/
│   └── api.ts            # Typed API client for backend
└── types/
    └── index.ts          # Shared TypeScript types
```

Key routes:

- `/` – Dashboard: lists all projects with create/open/delete actions.
- `/new` – Form to create a new project.
- `/projects/[id]` – Project detail page with:
  - Phase progress bar
  - Tabs for each phase (Ideation, Concept, Launch, etc.)
  - Per‑phase generate / regenerate buttons
  - Accordions for each artifact with markdown rendering
  - Variant selection for final spec (`Use in final` radios)
  - Export buttons (Full spec + Final spec, in multiple formats)
  - Code Generator tab (phase-based ZIP download + link to file-by-file generator)

- `/projects/[id]/codegen` – File-by-file code generator:
  - Generate one file at a time and store/edit files server-side
  - Download ZIP of stored files

---

## 5. How UI Maps to Backend

- **Project List (`/`)**
  - Uses `GET /projects` to list ideas.
  - Uses `DELETE /projects/{id}` to remove a project.

- **New Project (`/new`)**
  - Submits to `POST /projects` with:
    - `name`, `description`, `user_type`, `constraints`, `skills`, `time_available`.
  - On success, navigates to `/projects/{id}`.

- **Project Detail (`/projects/[id]`)**
  - Initial data from `GET /projects/{id}` (includes phases and artifacts).
  - **Generate / Regenerate** per phase:

    ```http
    POST /projects/{id}/phases/{phase_type}/generate
    ```

  - **Artifacts list** reused from the project detail payload.
  - **Full Export** (all artifacts, latest versions):
    - `GET /projects/{id}/export` (Markdown JSON)
    - `GET /projects/{id}/export-file?format=markdown|pdf|docx`
  - **Final Export** (selected variants + latest defaults):
    - `POST /projects/{id}/export-custom` with:

  - **Code ZIP** (phase-based, generated starter app):
    - `POST /projects/{id}/codezip`

  - **File-by-file code generator (chat-style):**
    - `GET /projects/{id}/codegen/sessions/latest`
    - `POST /projects/{id}/codegen/sessions`
    - `GET /codegen/sessions/{session_id}`
    - `POST /codegen/sessions/{session_id}/generate-file`
    - `PUT /codegen/sessions/{session_id}/files`
    - `GET /codegen/sessions/{session_id}/zip`

      ```json
      {
        "artifact_ids": [/* selected artifact IDs */],
        "format": "markdown" | "pdf" | "docx"
      }
      ```

---

## 6. Styling & Animations

- **Tailwind CSS** + custom CSS in `src/app/globals.css` for:
  - Color system (primary/secondary/accent, backgrounds, card colors).
  - Animated gradient header bar.
  - Card entrance animations, hover effects.
  - Tab underline animation.
  - AI loader (orbiting dots) for long‑running actions.
  - Idea input pulse animation on focus.

These are purely cosmetic and can be tweaked without breaking logic.

---

## 7. Common Issues

- **CORS / Network Errors**
  - Ensure backend is running and `NEXT_PUBLIC_API_URL` matches the backend origin.
  - Check browser console for blocked requests.

- **404 on `/projects/[id]`**
  - Project may have been deleted or the ID is incorrect.
  - Confirm via `GET /projects` in Swagger UI.

- **Hydration Warnings in Dev**
  - Browser extensions may inject attributes into `<html>`/`<body>`; try incognito.
  - These generally do not affect functionality in this app.

---

## 8. Next Steps for the Frontend

- Add toasts/notifications for long‑running generations.
- Improve mobile responsiveness of the `/projects/[id]` layout.
- Add a summary badge showing which artifact versions are selected for the final spec.
- Add a simple onboarding tooltip for first‑time users.
