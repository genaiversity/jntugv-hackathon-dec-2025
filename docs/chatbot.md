# Floating Chatbot

AI Innovation Hub includes a lightweight **floating chatbot** in the frontend UI to help users while they are:
- Creating a new project
- Browsing the dashboard
- Working inside a project’s phase workspace

It is intended for short Q/A and quick assistance (e.g. improving a project description), not as a replacement for the multi-phase generator.

## What it is

Frontend:
- Component: `ai-innovation-hub-frontend/src/components/FloatingChatBot.tsx`
- Mounted globally in: `ai-innovation-hub-frontend/src/app/layout.tsx`

Backend:
- Endpoint: `POST /chat`
- Implementation: `ai-innovation-hub-backend/app/main.py`
- Schemas: `ai-innovation-hub-backend/app/schemas.py` (`ChatRequest`, `ChatResponse`)

## How it works

### 1) UI state is included as context (best-effort)

The chatbot can attach lightweight “live context” to improve relevance:

- While creating a project (`/new`), the form writes a draft JSON payload to localStorage:
  - `aih:draftIdea`

- While viewing a project (`/projects/[id]`), the page writes a minimal project summary to localStorage:
  - `aih:activeProject`

When the user sends a message, the bot combines:
- A small static knowledge base (routes + phases)
- Any available localStorage context

…and sends it to the backend.

### 2) The backend responds using the primary model

`POST /chat`:
- Uses the primary model (`call_primary_model(...)`)
- Accepts a free-form user `message`
- Accepts optional `context` (string) from the frontend

The backend also:
- Short-circuits greetings (e.g. “hi”) to a short friendly response
- Cleans markdown-ish formatting in the reply for a nicer chat UI

## API

Request body:

```json
{
  "message": "Generate a better project description for: ...",
  "context": "(optional extra context)"
}
```

Response body:

```json
{
  "reply": "..."
}
```

## “Generate a better project description” behavior

The chatbot contains a small rule in its knowledge base:

If a user asks something like:
- “Generate a better project description for: …”

…the assistant should respond with **ONLY** the description text (no bullets, no markdown), so the user can paste it directly into the project description field.

## Notes / guardrails

- Do not store secrets in localStorage context.
- Keep chat messages short; this endpoint is intentionally lightweight.
- For more complex outputs, prefer the phase generator endpoints (`/projects/{id}/phases/{phase}/generate`).
