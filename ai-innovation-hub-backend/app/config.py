from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    lm_studio_base_url: str = "http://192.168.56.1:1234/v1"
    primary_model: str = "mistral-7b-instruct-v0.2"
    coder_model: str = "qwen2.5-coder-7b-instruct"
    database_url: str = "sqlite:///./innovation_hub.db"
    debug: bool = True

    # --- Guardrails (LLM output validation) ---
    enable_guardrails: bool = True
    max_generated_files: int = 30
    max_file_chars: int = 200_000
    max_total_chars: int = 2_000_000

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
