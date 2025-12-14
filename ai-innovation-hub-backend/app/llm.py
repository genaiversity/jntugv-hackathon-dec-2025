import httpx
from typing import Optional
from .config import get_settings

settings = get_settings()


async def call_llm(
    prompt: str,
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 4096
) -> str:
    """Call local LLM via LM Studio's OpenAI-compatible API.

    Resource-efficient: only one model is used per request.
    """
    model = model or settings.primary_model
    
    messages = []
    # Combine system prompt with user prompt since some models don't support system role
    if system_prompt:
        combined_prompt = f"{system_prompt}\n\n{prompt}"
        messages.append({"role": "user", "content": combined_prompt})
    else:
        messages.append({"role": "user", "content": prompt})
    
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            response = await client.post(
                f"{settings.lm_studio_base_url}/chat/completions",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            return result.get("choices", [{}])[0].get("message", {}).get("content", "")
        except httpx.HTTPError as e:
            raise Exception(f"LLM call failed: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error calling LLM: {str(e)}")


async def call_primary_model(prompt: str, system_prompt: Optional[str] = None) -> str:
    """Use primary model (e.g. mistral-7b-instruct-v0.2) for product/business content."""
    return await call_llm(prompt, model=settings.primary_model, system_prompt=system_prompt)


async def call_coder_model(prompt: str, system_prompt: Optional[str] = None) -> str:
    """Use coder model for technical/code content (can be same as primary).
    
    Uses higher max_tokens (8192) to allow for complete code generation.
    """
    return await call_llm(
        prompt, 
        model=settings.coder_model, 
        system_prompt=system_prompt,
        max_tokens=8192,
        temperature=0.3  # Lower temperature for more consistent code output
    )


async def check_llm_status() -> dict:
    """Check if the LM Studio OpenAI-compatible server is reachable and list models."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # LM Studio exposes an OpenAI-style /models endpoint
            response = await client.get(f"{settings.lm_studio_base_url}/models")
            response.raise_for_status()
            data = response.json()
            models = [m.get("id") for m in data.get("data", [])]
            return {
                "status": "online",
                "models": models,
                "primary_model": settings.primary_model,
                "coder_model": settings.coder_model,
            }
        except Exception as e:
            return {
                "status": "offline",
                "error": str(e),
                "models": [],
            }
