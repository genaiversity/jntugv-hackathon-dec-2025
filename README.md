# AI Innovation Hub (Monorepo)

AI Innovation Hub is an **AI co-founder** for students, early-stage founders, and hackathon teams: it transforms a rough idea into a **validated, structured, build-ready mini-startup blueprint** using Generative AI workflows.

**Live documentation site:** https://monkey9-cyber-cat-spidy.github.io/jntugv-hackathon-dec-2025-Team-85/

**Youtube Demo :** [![YouTube Demo](https://img.youtube.com/vi/fNwly3vk_ac/0.jpg)](https://www.youtube.com/watch?v=fNwly3vk_ac)


## Problem Statement
Students, early-stage founders, and hackathon participants often begin with raw, unstructured ideas but lack the experience to convert them into clear, validated, and buildable product concepts. They struggle with defining user personas, shaping solution directions, prioritizing feature sets, and preparing early assets like landing-page content, pitches, or workflow diagrams. As a result, teams waste time, lose clarity, and fail to move ideas toward implementation.

While individual AI tools exist for writing, summarizing, or diagram generation, there is no unified system that transforms a vague idea into a validated, actionable mini-startup blueprint. There is no automated workflow that handles ideation, feasibility evaluation, tech-stack guidance, and experiment planning in one place—especially for beginners who lack product thinking, technical mentorship, or startup experience.

**Core question:** How can we use Generative AI and agentic workflows to help novices turn rough ideas into validated, structured, and testable mini-startup concepts—quickly, consistently, and without expert supervision?

## Solution Description
AI Innovation Hub provides an end-to-end multi-phase workflow:

- Converts raw ideas into a refined **problem statement** and assumptions
- Generates **user personas**, use-cases, and value propositions
- Produces multiple **solution concepts** and a prioritized **feature list**
- Creates **launch content** (landing page copy, pitch outline, taglines)
- Designs **validation experiments**, surveys, and success metrics
- Suggests a suitable **tech stack** and **API design** aligned to constraints
- Generates a runnable **starter app** and supports ZIP export
- Exports a complete blueprint as **Markdown / PDF / DOCX**

Implementation is split into:
- A **FastAPI backend** that orchestrates LLM calls and stores artifacts in SQLite
- A **Next.js frontend** that provides a judge-friendly multi-phase workspace

## Repository Structure

```text
./
├── ai-innovation-hub-backend/   # FastAPI + SQLModel + SQLite
├── ai-innovation-hub-frontend/  # Next.js (App Router) + Tailwind
└── run_all.bat                  # Convenience script to start backend + frontend (Windows)
```

## Diagrams (Mermaid)

### System architecture (high level)

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

### Frontend architecture

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

### Frontend workflow (phase generation)

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

### Backend architecture

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

### Backend workflow (file-by-file code generator)

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

### Chatbot architecture + flow

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

### End-to-end data flow (projects → phases → exports)

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

## Quickstart (Windows)

1. Start **LM Studio** and run its OpenAI-compatible local server (required for generation).
2. From the repo root, run:

```bat
run_all.bat
```

This opens two terminal windows:

- Backend: `http://localhost:8000/docs`
- Frontend: `http://localhost:3000`

## Team

- **Kuncham Venkata Satya Manikanta** — Full stack Developer & Team lead: https://www.linkedin.com/in/kvsmanikanta/
- **Sarathchandra Chitrada** — DataBase designer: https://www.linkedin.com/in/sarathchandra-chitrada/
- **Lokesh Baggu** — Frontend Developer: https://www.linkedin.com/in/lokesh-baggu-46b4b3299

## More Documentation

- Central docs index (for judges): `docs/README.md`
- Project overview (full problem statement + system overview): `ai-innovation-hub-frontend/PROJECT_DOCUMENTATION.md`
- Backend: `ai-innovation-hub-backend/README.md` and `ai-innovation-hub-backend/BACKEND_DOCS.md`
- Frontend: `ai-innovation-hub-frontend/README.md` and `ai-innovation-hub-frontend/FRONTEND_DOCS.md`
- Guardrails & evals (tests, CI, validation rules): `ai-innovation-hub-backend/GUARDRAILS_AND_EVALS.md`
