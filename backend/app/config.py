from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "moodmeld"

    # JWT
    JWT_SECRET_KEY: str = "change-this-in-production-min-32-characters-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # App
    APP_NAME: str = "MoodMeld 2.0"
    DEBUG: bool = True

    # OpenAI / Groq (Phase 6)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = None  # Set to Groq URL if using Groq
    OPENAI_MODEL: str = "gpt-4o-mini"      # or "llama-3.1-70b-versatile" for Groq

    # Spotify (Phase 6)
    SPOTIFY_CLIENT_ID: Optional[str] = None
    SPOTIFY_CLIENT_SECRET: Optional[str] = None

    # TMDB (Phase 6)
    TMDB_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
