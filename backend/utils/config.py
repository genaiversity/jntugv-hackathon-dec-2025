"""Configuration management using Pydantic settings."""
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "AI Assistant Backend"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # MongoDB
    mongodb_url: str = "mongodb://mongodb:27017"
    mongodb_database: str = "ai_assistant"
    
    # Redis
    redis_url: str = "redis://redis:6379"
    redis_db: int = 0
    redis_ttl: int = 3600  # 1 hour default TTL
    
    # Google APIs
    google_credentials_file: str = "credentials.json"
    google_token_file: str = "token.json"
    
    # LLM Configuration
    llm_provider: str = "groq"  # Options: "gemini" or "groq"
    
    # Gemini AI
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.0-flash"
    
    # Groq AI
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"
    
    # Slack
    slack_bot_token: Optional[str] = None
    
    # Twilio (SMS)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    cors_origins: list = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
