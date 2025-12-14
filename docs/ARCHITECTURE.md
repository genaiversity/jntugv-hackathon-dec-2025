# Architecture

This document consolidates the key architectural details of **AI Innovation Hub** into one place for reviewers.

Primary sources:
- `ai-innovation-hub-frontend/PROJECT_DOCUMENTATION.md`
- `ai-innovation-hub-backend/BACKEND_DOCS.md`
- `ai-innovation-hub-frontend/FRONTEND_DOCS.md`

## 1. System goal

AI Innovation Hub transforms a rough, unstructured idea into a **validated, structured mini-startup blueprint**, using a multi-phase workflow driven by LLM generation and persisted as versioned artifacts.

## 2. Conceptual architecture

### 2.1 System architecture (high level)

```mermaid
flowchart LR
  U[User] -->|Browser| FE[Next.js Frontend]
  FE -->|REST| BE[FastAPI Backend]

  BE -->|OpenAI-compatible HTTP| LLM["LM Studio (OpenAI-compatible LLM)"]
  BE -->|SQLModel| DB[("SQLite: innovation_hub.db")]

  FE -->|Download exports| EXP["Spec export (md, pdf, docx)"]
  BE -->|Build| EXP

  FE -->|Download code| ZIP["Generated app ZIP"]
  BE -->|Build ZIP from JSON or codegen session| ZIP
```

### 2.2 Frontend architecture

```mermaid
flowchart TD
  subgraph Next.js App Router
    HOME["/ (Landing)"]
    DASH["/dashboard"]
    NEW["/new"]
    PROJ["/projects/:id"]
    CODEGEN["/projects/:id/codegen"]
  end

  HOME --> DASH
  HOME --> NEW
  DASH --> PROJ
  PROJ --> CODEGEN

  BOT[FloatingChatBot]:::ui

  HOME --> BOT
  DASH --> BOT
  NEW --> BOT
  PROJ --> BOT
  CODEGEN --> BOT

  API[src/lib/api.ts]:::code
  TYPES[src/types/index.ts]:::code

  HOME --> API
  DASH --> API
  NEW --> API
  PROJ --> API
  CODEGEN --> API

  API -->|HTTP| BE[FastAPI Backend]

  NEW -->|writes draft context| LS[(localStorage)]:::store
  PROJ -->|writes active project summary| LS
  BOT -->|reads context| LS

  classDef ui fill:#eef2ff,stroke:#6366f1,color:#111827;
  classDef code fill:#ecfeff,stroke:#14b8a6,color:#111827;
  classDef store fill:#fff7ed,stroke:#f59e0b,color:#111827;
```

### 2.3 Backend architecture

```mermaid
flowchart TD
  ROUTES["app/main.py\nFastAPI routes"] --> SVC["app/services.py\nphase orchestration"]
  SVC --> PROMPTS["app/prompts.py\nprompt templates"]
  SVC --> LLM["app/llm.py\nOpenAI-compatible client"]
  ROUTES --> GUARD["app/guardrails.py\nJSON/path validation"]
  ROUTES --> CODEGEN["app/codegen.py\nfile-by-file prompts/parsing"]

  ROUTES --> DB[("SQLite via SQLModel")]
  SVC --> DB
  CODEGEN --> DB

  LLM --> LMSTUDIO["LM Studio server\nchat/completions"]
```

## 3. Core concepts

### 3.1 Projects
A **Project** stores the user’s input (idea, constraints, skills, time available) and acts as the root entity for generation.

### 3.2 Phases
A project is guided through ordered phases:

- `ideation`
- `concept_design`
- `launch_content`
- `validation`
- `tech_build`
- `code_generation`
- `final_spec`

Each phase generates one or more **artifacts**.

### 3.3 Artifacts (versioned)
Artifacts are the generated outputs (problem statement, personas, feature list, etc.).

- Stored in SQLite
- Regeneration creates a new **version**
- Frontend can display multiple versions and allow selection when exporting a “final” spec

### 3.4 Code generation modes

1. Phase-based multi-file generation
- The `code_generation` phase produces a single JSON payload representing multiple files.
- The backend can export a ZIP from the latest generated artifact.

2. File-by-file code generation (chat-style)
- Creates a codegen session tied to a project.
- Generates individual files with a strict JSON format (`{path, content}`).
- Files can be edited/saved server-side and zipped.

## 4. Components

### 4.1 Frontend (Next.js)
Responsibilities:
- Collect project inputs
- Provide a multi-phase workspace UI
- Render artifacts as markdown
- Trigger generation/regeneration per phase
- Allow per-phase “custom instructions” (prompt styling)
- Provide codegen UI (phase-based and file-by-file)
- Trigger export flows (full export + “final spec” from selected variants)
- Provide lightweight help via the floating chatbot

Key routes (high-level):
- `/` landing page (Spline hero background)
- `/dashboard` projects dashboard
- `/new` create new project
- `/projects/[id]` multi-phase workspace
- `/projects/[id]/codegen` file-by-file generator

Notable UI enhancements:
- **Spline hero**: the landing page uses `@splinetool/react-spline` to render a 3D scene in the background.
- **Floating chatbot**: a global chat widget that calls backend `POST /chat` and can include live UI context.

### 4.2 Backend (FastAPI)
Responsibilities:
- REST API for projects/phases/artifacts
- LLM orchestration for generation
- Persistence + versioning via SQLModel
- Export pipeline (markdown + PDF/DOCX conversions)
- Code ZIP export for generated apps
- Lightweight chat endpoint for the UI chatbot (`POST /chat`)

Backend code layout (high-level):
- `app/main.py`: FastAPI routes + export + codegen endpoints + `POST /chat`
- `app/services.py`: phase generation orchestration
- `app/prompts.py`: prompt templates
- `app/llm.py`: OpenAI-compatible LLM client (LM Studio)
- `app/models.py`: SQLModel models

### 4.3 LLM layer
- Backend calls an OpenAI-compatible endpoint configured via `.env` (LM Studio by default).
- Uses a primary model for product/business content.
- Uses a coder model for tech-heavy and code artifacts.

### 4.4 Persistence
- SQLite database (`innovation_hub.db` by default)
- Stores:
  - projects
  - phases
  - artifacts
  - codegen sessions/files/messages

## 5. Guardrails and evaluation hooks

The repo includes guardrails and tests to improve reliability where strict JSON is required (code generation and ZIP export).

- Docs: `ai-innovation-hub-backend/GUARDRAILS_AND_EVALS.md`
- Unit tests validate JSON parsing, safe paths, and payload constraints.

## 6. Key flows

### 6.1 Frontend workflow (phase generation)

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant FE as Next.js UI
  participant API as src/lib/api.ts
  participant BE as FastAPI

  User->>FE: Create project (/new)
  FE->>API: projects.create()
  API->>BE: POST /projects
  BE-->>API: project
  API-->>FE: project
  FE-->>User: Navigate to /projects/{id}

  User->>FE: Click Generate for a phase
  FE->>API: phases.generate(projectId, phaseType)
  API->>BE: POST /projects/:id/phases/:phase_type/generate
  BE-->>API: phase + artifacts
  API-->>FE: phase + artifacts
  FE-->>User: Render artifacts (markdown)
```

### 6.2 Backend workflow (file-by-file code generator)

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant FE as Next.js UI (/projects/:id/codegen)
  participant BE as FastAPI
  participant DB as SQLite
  participant LLM as Coder/Primary model

  User->>FE: Open codegen page
  FE->>BE: GET /projects/:id/codegen/sessions/latest
  alt no existing session
    FE->>BE: POST /projects/:id/codegen/sessions
  end
  BE->>DB: Create/Fetch CodeGenSession
  DB-->>BE: session_id
  BE-->>FE: session

  FE->>BE: GET /codegen/sessions/{session_id}
  BE->>DB: Load CodeGenFiles + CodeGenMessages
  BE-->>FE: session detail

  User->>FE: Generate a file
  FE->>BE: POST /codegen/sessions/:session_id/generate-file {path, instructions}
  BE->>DB: Load latest artifacts (tech_stack/api_design/etc.)
  BE->>LLM: Generate single-file JSON {path, content}
  LLM-->>BE: JSON
  BE->>BE: Guardrails validate path + JSON
  BE->>DB: Upsert CodeGenFile + store CodeGenMessage
  BE-->>FE: saved file

  User->>FE: Download ZIP
  FE->>BE: GET /codegen/sessions/:session_id/zip
  BE->>DB: Fetch all stored files
  BE-->>FE: ZIP download
```

### 6.3 Chatbot architecture + flow

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Bot as FloatingChatBot (frontend)
  participant BE as FastAPI POST /chat
  participant LLM as Primary model (mistral)

  User->>Bot: Type message (e.g., "hi" / "generate description")
  Bot->>Bot: Read localStorage context (draft idea / active project)
  Bot->>BE: POST /chat {message, context}

  alt Greeting fast-path
    BE-->>Bot: "Hi! How can I help?"
  else Normal message
    BE->>LLM: call_primary_model(prompt + context)
    LLM-->>BE: reply (may contain markdown)
    BE->>BE: sanitize reply (remove **, `, headings)
    BE-->>Bot: cleaned reply
  end

  Bot-->>User: Render message bubble
```

### 6.4 End-to-end data flow (projects → phases → exports)

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant FE as Next.js UI
  participant BE as FastAPI API
  participant DB as SQLite
  participant LLM as LLM Server

  User->>FE: Enter idea + constraints
  FE->>BE: POST /projects
  BE->>DB: Insert Project + Phases
  DB-->>BE: project_id
  BE-->>FE: Project created

  User->>FE: Generate a phase
  FE->>BE: POST /projects/:id/phases/:phase_type/generate
  BE->>DB: Load project + prior artifacts
  BE->>LLM: /chat/completions (primary/coder model)
  LLM-->>BE: Generated artifact text/JSON
  BE->>DB: Store Artifact (versioned)
  BE-->>FE: Updated phase + artifacts

  User->>FE: Export spec / download ZIP
  FE->>BE: GET /projects/:id/export-file OR POST /projects/:id/codezip
  BE->>DB: Fetch latest chosen artifacts / generated app payload
  BE-->>FE: File download (PDF/DOCX/MD or ZIP)
```
