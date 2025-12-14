from __future__ import annotations

from pydantic import BaseModel, Field, ValidationError
from typing import Any, Optional
import json
import os
import re


class GuardrailError(ValueError):
    """Raised when an LLM output violates required format/constraints."""


def _safe_relpath(path: str) -> str:
    """Normalize and validate a repo-relative path.

    Prevents path traversal and absolute paths.
    """
    if not isinstance(path, str) or not path.strip():
        raise GuardrailError("File path must be a non-empty string")

    p = path.replace("\\", "/").lstrip("/")
    norm = os.path.normpath(p).replace("\\", "/")

    # Disallow drive letters / absolute-ish paths
    if ":" in norm:
        raise GuardrailError(f"Unsafe file path (drive letter) in output: {path}")

    # Disallow traversal
    if norm == ".." or norm.startswith("../"):
        raise GuardrailError(f"Unsafe file path (traversal) in output: {path}")

    # Disallow hidden path escalation like /.git
    if norm.startswith(".git/") or norm == ".git":
        raise GuardrailError(f"Unsafe file path (.git) in output: {path}")

    return norm


class GeneratedFile(BaseModel):
    path: str
    content: str

    def normalized_path(self) -> str:
        return _safe_relpath(self.path)


class GeneratedAppPayload(BaseModel):
    files: list[GeneratedFile] = Field(min_length=1)
    instructions: str = Field(default="")


class SingleFilePayload(BaseModel):
    path: str
    content: str

    def normalized_path(self) -> str:
        return _safe_relpath(self.path)


def extract_json_candidate(text: str) -> str:
    """Extract best-effort JSON candidate from LLM output.

    Supports:
    - raw JSON
    - markdown fenced blocks ```json ... ```
    - leading/trailing commentary

    Returns a string that *should* be a JSON object.
    """
    raw = (text or "").strip()
    if not raw:
        raise GuardrailError("Empty LLM output")

    # Prefer fenced JSON blocks
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw, flags=re.IGNORECASE)
    if m:
        candidate = m.group(1).strip()
        if candidate:
            return candidate

    # Otherwise try to find the first outermost JSON object
    start = raw.find("{")
    if start == -1:
        raise GuardrailError("LLM output did not contain a JSON object")

    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(raw)):
        ch = raw[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue

        if ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return raw[start : i + 1]

    raise GuardrailError("Could not find a complete JSON object in LLM output")


def parse_json_object(text: str) -> dict[str, Any]:
    candidate = extract_json_candidate(text)

    # Common failure: double braces {{...}}
    c = candidate.strip()
    if c.startswith("{{") and c.endswith("}}"):
        c = c[1:-1].strip()

    try:
        data = json.loads(c)
    except json.JSONDecodeError as e:
        raise GuardrailError(f"Invalid JSON: {e.msg} at pos {e.pos}")

    if not isinstance(data, dict):
        raise GuardrailError("JSON root must be an object")

    return data


def validate_generated_app_payload(
    text: str,
    *,
    max_files: int = 30,
    max_file_chars: int = 200_000,
    max_total_chars: int = 2_000_000,
) -> GeneratedAppPayload:
    """Validate payload for multi-file code generation artifacts."""
    data = parse_json_object(text)

    try:
        payload = GeneratedAppPayload.model_validate(data)
    except ValidationError as e:
        raise GuardrailError(f"Payload did not match schema: {str(e)}")

    if len(payload.files) > max_files:
        raise GuardrailError(f"Too many files in output: {len(payload.files)} > {max_files}")

    total = 0
    seen_paths: set[str] = set()
    for f in payload.files:
        np = f.normalized_path()
        if np in seen_paths:
            raise GuardrailError(f"Duplicate file path in output: {np}")
        seen_paths.add(np)

        if len(f.content) > max_file_chars:
            raise GuardrailError(f"File too large: {np} ({len(f.content)} chars) > {max_file_chars}")
        total += len(f.content)

    if total > max_total_chars:
        raise GuardrailError(f"Total output too large: {total} chars > {max_total_chars}")

    return payload


def validate_single_file_payload(
    text: str,
    *,
    max_file_chars: int = 200_000,
) -> SingleFilePayload:
    """Validate payload for file-by-file code generation endpoint."""
    data = parse_json_object(text)

    try:
        payload = SingleFilePayload.model_validate(data)
    except ValidationError as e:
        raise GuardrailError(f"Payload did not match schema: {str(e)}")

    np = payload.normalized_path()
    if len(payload.content) > max_file_chars:
        raise GuardrailError(f"File too large: {np} ({len(payload.content)} chars) > {max_file_chars}")

    return payload
