# Evaluation Notes (Hackathon)

This project’s evaluation approach is documented across existing repo docs.

## What we currently evaluate (automated)

- Guardrails-focused unit tests for LLM-produced JSON payloads used in code generation:
  - `ai-innovation-hub-backend/tests/test_guardrails.py`
  - Run: `pytest -q` inside `ai-innovation-hub-backend/`

What these tests cover:
- JSON extraction from fenced blocks
- Rejecting non-object JSON
- Safe path enforcement (no `../`, no drive-letter paths)
- Duplicate path rejection
- Minimal valid payload acceptance

Details:
- `ai-innovation-hub-backend/GUARDRAILS_AND_EVALS.md`

## Limitations (documented)

The main limitations are described in:
- `ai-innovation-hub-frontend/PROJECT_DOCUMENTATION.md` (Evaluation, Limitations & Future Work)

Key notes:
- LLM outputs are assistive; human review is required.
- Quality depends on clarity of the input idea.
- Tech feasibility checks are high-level.
- Long context projects may hit local LLM context limits (mitigated with file-by-file generator).

## Optional “live eval”

A smoke-test script exists (requires backend + LLM running):
- `ai-innovation-hub-backend/app/evals_live.py`

It verifies an end-to-end generation + ZIP export flow.
