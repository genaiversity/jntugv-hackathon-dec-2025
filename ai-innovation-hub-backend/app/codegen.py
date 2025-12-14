import json
import os
import re
from typing import Any


FILE_JSON_RULES = """Return ONLY valid JSON with this exact schema:
{"path":"relative/path.ext","content":"..."}

Rules:
- Output must start with { and end with }
- No markdown fences
- No commentary
- Use double quotes
- Escape newlines inside content as \\n (two characters: backslash + n)
- Escape quotes inside content as \\\" 

Few-shot examples (follow this style exactly):

Example 1:
{"path":"README.md","content":"# My App\\n\\nRun: npm install\\n"}

Example 2:
{"path":"src/index.js","content":"console.log(\\"hello\\")\\n"}

If you cannot comply, still return JSON with best-effort content.
"""


def safe_relpath(p: str) -> str:
    """Normalize and validate a relative path. Reject absolute paths and traversal."""
    p = (p or "").replace("\\", "/")
    p = p.lstrip("/")
    norm = os.path.normpath(p).replace("\\", "/")
    if not norm or norm == "." or norm.startswith("../") or norm == ".." or ":" in norm:
        raise ValueError(f"Unsafe file path: {p}")
    return norm


def normalize_content(content: str) -> str:
    """Convert common escaped sequences into real characters (for writing to disk)."""
    if content is None:
        return ""
    content = content.replace("\\n", "\n")
    content = content.replace("\\t", "\t")
    content = content.replace('\\"', '"')
    content = content.replace("\\\\", "\\")
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    return content


def _try_parse_json(text: str) -> dict | None:
    raw = (text or "").strip()
    # Strip markdown fences if present
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if fence:
        raw = fence.group(1).strip()

    # Try direct parse
    try:
        obj = json.loads(raw)
        return obj if isinstance(obj, dict) else None
    except Exception:
        pass

    # Try to extract first JSON object substring
    start = raw.find("{")
    if start != -1:
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
            else:
                if ch == '"':
                    in_str = True
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        candidate = raw[start : i + 1]
                        try:
                            obj = json.loads(candidate)
                            return obj if isinstance(obj, dict) else None
                        except Exception:
                            return None
    return None


def parse_file_json(text: str) -> dict[str, str]:
    obj = _try_parse_json(text)
    if not obj:
        raise ValueError("Could not parse JSON from model output")

    path = obj.get("path")
    content = obj.get("content")
    if not isinstance(path, str) or not isinstance(content, str):
        raise ValueError("Model output JSON must contain string fields 'path' and 'content'")

    return {"path": safe_relpath(path), "content": content}


def shorten(text: str | None, max_chars: int) -> str:
    if not text:
        return ""
    if len(text) <= max_chars:
        return text
    # Keep the start; models benefit from leading context.
    return text[:max_chars] + "\n\n[...truncated...]"


def suggest_file_paths(tech_stack: str | None) -> list[str]:
    """Return a recommended file list based on the tech stack text.

    This is intentionally heuristic and should be stable.
    """
    ts = (tech_stack or "").lower()

    # Next.js (App Router)
    if "next.js" in ts or "nextjs" in ts:
        return [
            "README.md",
            "package.json",
            "next.config.ts",
            "tsconfig.json",
            ".env.example",
            "src/app/layout.tsx",
            "src/app/page.tsx",
            "src/app/globals.css",
            "src/lib/api.ts",
        ]

    # React + Vite
    if "vite" in ts and "react" in ts:
        return [
            "README.md",
            "package.json",
            "vite.config.ts",
            "tsconfig.json",
            "index.html",
            "src/main.tsx",
            "src/App.tsx",
            "src/index.css",
        ]

    # Node + Express
    if "express" in ts or "node" in ts:
        return [
            "README.md",
            "package.json",
            ".env.example",
            "src/server.ts",
            "src/routes/index.ts",
            "src/middleware/error.ts",
        ]

    # Python + FastAPI
    if "fastapi" in ts or ("python" in ts and "api" in ts):
        return [
            "README.md",
            "requirements.txt",
            ".env.example",
            "app/main.py",
            "app/models.py",
            "app/schemas.py",
        ]

    # Minimal default
    return [
        "README.md",
        "package.json",
        "src/index.js",
    ]


def build_generate_file_prompt(
    *,
    project_name: str,
    project_description: str,
    tech_stack: str | None,
    api_design: str | None,
    feature_list: str | None,
    user_flows: str | None,
    existing_files: list[str],
    target_path: str,
    instructions: str | None,
) -> str:
    files_list = "\n".join(f"- {p}" for p in existing_files) if existing_files else "(none)"

    prompt = f"""You are generating a single file for a starter app.

Project:
- Name: {project_name}
- Description: {project_description}

Context (may be partial):
- Tech stack:\n{shorten(tech_stack, 1200)}
- API design:\n{shorten(api_design, 1200)}
- Feature list:\n{shorten(feature_list, 1200)}
- User flows:\n{shorten(user_flows, 1200)}

Existing files (paths only):
{files_list}

Target file to generate:
{target_path}

User instructions:
{instructions or "(none)"}

{FILE_JSON_RULES}
"""
    return prompt
