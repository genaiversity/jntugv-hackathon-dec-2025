"""Live evals (smoke tests) for AI Innovation Hub.

These are *optional* and require:
- backend running
- LM Studio (or other OpenAI-compatible server) running and reachable

Run:
  python -m app.evals_live

This is intentionally lightweight and not part of CI by default.
"""

from __future__ import annotations

import asyncio
import httpx


API = "http://localhost:8000"


async def main() -> None:
    async with httpx.AsyncClient(timeout=300.0) as client:
        health = await client.get(f"{API}/health")
        health.raise_for_status()
        print("health:", health.json().get("llm", {}).get("status"))

        # Create a tiny project
        proj = await client.post(
            f"{API}/projects",
            json={
                "name": "Eval Project",
                "description": "A minimal test project",
                "user_type": "student",
                "constraints": "none",
                "skills": "beginner",
                "time_available": "1 day",
            },
        )
        proj.raise_for_status()
        pid = proj.json()["id"]

        # Generate ideation (should succeed)
        r = await client.post(f"{API}/projects/{pid}/phases/ideation/generate", json={"regenerate": False})
        r.raise_for_status()

        # Generate concept_design
        r = await client.post(f"{API}/projects/{pid}/phases/concept_design/generate", json={"regenerate": False})
        r.raise_for_status()

        # Generate tech_build
        r = await client.post(f"{API}/projects/{pid}/phases/tech_build/generate", json={"regenerate": False})
        r.raise_for_status()

        # Generate code_generation (this is where JSON guardrails matter)
        r = await client.post(f"{API}/projects/{pid}/phases/code_generation/generate", json={"regenerate": False})
        r.raise_for_status()

        # Attempt to build ZIP (will validate JSON)
        z = await client.post(f"{API}/projects/{pid}/codezip", json={})
        z.raise_for_status()
        print("codezip ok; bytes:", len(z.content))


if __name__ == "__main__":
    asyncio.run(main())
