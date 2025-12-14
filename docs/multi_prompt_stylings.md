# Multi-prompt stylings (prompting strategy)

AI Innovation Hub uses *multiple prompt “styles”* depending on what is being generated:
- Business/product content (problem statement, personas, validation, etc.)
- Technical design content (tech stack, API design, tasks)
- Strict-format outputs (multi-file code generation JSON)
- Lightweight UI helper chat (floating bot)

This is intentional: different tasks require different reliability/structure tradeoffs.

## Where prompts live

Backend prompt templates:
- `ai-innovation-hub-backend/app/prompts.py`

Backend orchestration (prompt chaining + phase context):
- `ai-innovation-hub-backend/app/services.py`

## Prompt “styles” used

### 1) System prompt (global behavior)

`SYSTEM_PROMPT` defines baseline behavior such as:
- “Expert startup advisor” persona
- Clear sections with headings
- Tailoring to user constraints
- Optional internal planning/self-check (without revealing chain-of-thought)

The backend passes this as the system prompt when calling the model.

### 2) Phase-specific, artifact-specific instruction prompts

Each phase contains multiple artifact prompts (e.g. `ideation -> problem_statement`, `personas`, `idea_variants`).

These prompts:
- Include project fields (name/description/user_type/constraints)
- Reference earlier artifacts when available (prompt chaining)
- Specify an output structure (headings/bullets) to make results easy to review/export

### 3) Prompt chaining (multi-step context building)

Later phases build on earlier outputs.

Examples:
- `concept_design` uses ideation artifacts
- `launch_content` uses feature list + personas
- `validation` uses the earlier product framing
- `tech_build` uses features + user flows

This creates a consistent narrative across the generated blueprint.

### 4) Few-shot prompting for strict schemas (especially code generation)

Some endpoints require outputs that must be parsed strictly (JSON). For these, prompts include:
- Hard rules: “Output ONLY valid JSON”
- Escaping rules for newlines/quotes
- A concrete example of correct JSON output

This is most visible in:
- `code_generation -> generated_app`

## UI-driven customization: per-phase custom instructions

The frontend project workspace (`/projects/[id]`) lets users optionally provide **Custom Instructions** for most phases.

Frontend:
- `ai-innovation-hub-frontend/src/app/projects/[id]/page.tsx`

Backend schema:
- `GenerateRequest.custom_instructions`

This is a lightweight way to “style” outputs without changing any schemas (examples: “make it mobile-first”, “target enterprise”, “keep it simple for a 2-day hackathon”).

## Lightweight chat prompt (floating bot)

The floating bot uses a different style than phase generation:
- Short, natural replies (1–2 sentences by default)
- Avoid listing features unless asked
- Special-case: “generate a better project description” returns only plain text

Backend:
- `POST /chat` in `ai-innovation-hub-backend/app/main.py`

## Extending / adding new prompt styles

Common ways to extend this system safely:
- Add a new artifact prompt under an existing phase (keeps workflow stable)
- Add a new phase type only if you also update:
  - backend enums/models
  - frontend phase lists/labels
  - docs/architecture
- If you want “tone modes” (e.g. *formal*, *creative*, *investor pitch*), prefer adding an explicit field (e.g. `tone`) in request schemas rather than trying to infer it from free-form text.
