# Guardrails & Evals (Backend)

This backend contains two related quality/safety layers:

1. Guardrails: validate and constrain LLM outputs before the backend trusts them.
2. Evals/tests: automated checks (unit tests + CI) to prevent regressions.

This doc explains what was added, how it works, and how to run it.

## 1. What “guardrails” means in this repo

Guardrails here focus on **LLM output correctness and safety** (not content moderation):

- Ensure LLM outputs are valid JSON for the endpoints that require it.
- Prevent unsafe file paths (path traversal, absolute paths, .git access).
- Limit output size (max files, max per-file size, max total size).

These guardrails protect the ZIP generation flow and file-by-file code generation from malformed or unsafe model output.

## 2. Where guardrails are enforced

### 2.1 File-by-file code generation endpoint

Endpoint:
- `POST /codegen/sessions/{session_id}/generate-file`

Guardrail behavior:
- Validates the model output as JSON object with:
  - `path: string`
  - `content: string`
- Normalizes the file path (converts backslashes, removes leading `/`, resolves `..`).
- Rejects unsafe paths (examples: `../secret.txt`, `C:\\Windows\\...`, `.git/config`).
- Rejects overly large file content.

Implementation:
- `ai-innovation-hub-backend/app/main.py` uses:
  - `validate_single_file_payload()` from `app/guardrails.py`

### 2.2 Phase-based code ZIP endpoint

Endpoint:
- `POST /projects/{project_id}/codezip`

Guardrail behavior:
- Validates the stored `generated_app` artifact content as JSON object with:
  - `files: [{ path: string, content: string }, ...]`
  - `instructions: string`
- Normalizes and validates each file path.
- Rejects duplicate paths.
- Enforces:
  - max number of files
  - max file size
  - max total size across all files

Implementation:
- `ai-innovation-hub-backend/app/main.py` uses:
  - `validate_generated_app_payload()` from `app/guardrails.py`

## 3. Guardrails implementation details

File:
- `ai-innovation-hub-backend/app/guardrails.py`

Key components:

- `GuardrailError`
  - Raised when the LLM output violates schema or safety constraints.

- JSON extraction helpers
  - `extract_json_candidate(text)`
    - Accepts:
      - raw JSON
      - fenced blocks like ```json ... ```
      - text with leading/trailing commentary
    - Extracts the most likely JSON object string.

  - `parse_json_object(text)`
    - Parses extracted JSON and requires the root to be a JSON object.

- Schemas (Pydantic)
  - `SingleFilePayload` -> `{ path, content }`
  - `GeneratedAppPayload` -> `{ files: [...], instructions }`

- Validators
  - `validate_single_file_payload(text, max_file_chars=...)`
  - `validate_generated_app_payload(text, max_files=..., max_file_chars=..., max_total_chars=...)`

- Path safety
  - `_safe_relpath(path)` ensures:
    - no path traversal (`../`)
    - no Windows drive letter paths (`C:`)
    - no `.git/...` paths

## 4. Guardrails configuration

Settings live in:
- `ai-innovation-hub-backend/app/config.py`

Environment variables (optional):

- `ENABLE_GUARDRAILS` (default: `true`)
  - Set to `false` to revert to legacy parsing behavior.

- `MAX_GENERATED_FILES` (default: `30`)
- `MAX_FILE_CHARS` (default: `200000`)
- `MAX_TOTAL_CHARS` (default: `2000000`)

Note: these are loaded via `pydantic-settings` from `.env`.

## 5. Evals / tests

### 5.1 Unit tests (fast, no LLM required)

Tests are implemented with pytest.

Files:
- `ai-innovation-hub-backend/tests/test_guardrails.py`
- `ai-innovation-hub-backend/pytest.ini`

What is tested:
- extracting JSON from fenced code blocks
- rejecting non-object JSON roots
- normalizing safe paths
- rejecting traversal paths
- rejecting duplicate file paths
- accepting minimal valid payloads

Run locally:

```bash
cd ai-innovation-hub-backend
python -m pip install -r requirements.txt
pytest -q
```

### 5.2 Live evals (optional smoke test)

File:
- `ai-innovation-hub-backend/app/evals_live.py`

This script:
- calls `/health`
- creates a small project
- generates a few phases
- attempts `/codezip` (which triggers JSON validation)

Run (requires backend + LLM running):

```bash
cd ai-innovation-hub-backend
python -m app.evals_live
```

## 6. CI (GitHub Actions)

Workflow:
- `.github/workflows/backend-tests.yml`

It runs pytest on push/PR when backend files change.

## 7. Troubleshooting

- "Could not parse/validate generated JSON"
  - The model likely returned non-JSON or malformed JSON.
  - Try regenerating the phase; consider using the file-by-file generator for local models with small context windows.

- Guardrails are too strict for your model output
  - Temporarily set `ENABLE_GUARDRAILS=false` in `.env`.
  - Prefer updating prompts and/or increasing limits instead of disabling long-term.
