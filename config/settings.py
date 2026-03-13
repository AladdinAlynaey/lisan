"""
Lisan - Centralized Configuration
Loads all settings from .env file.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv(override=True)


class Config:
    """Application configuration loaded from environment variables."""

    # ── Flask ──────────────────────────────────────────────
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    PORT = int(os.getenv("FLASK_PORT", 5018))

    # ── OpenRouter (Primary - Advanced) ───────────────────
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash-preview")
    OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "google/gemini-2.5-flash-preview")
    OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    # ── Groq (Secondary - Standard) ──────────────────────
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "meta-llama/llama-4-maverick-17b-128e-instruct")
    GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

    # ── Ollama (Fallback - Local) ────────────────────────
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

    # ── Timeouts & Limits ────────────────────────────────
    AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", 30))
    RATE_LIMIT_ANALYZE = os.getenv("RATE_LIMIT_ANALYZE", "10/minute")
    RATE_LIMIT_CHAT = os.getenv("RATE_LIMIT_CHAT", "20/minute")
    MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", 10))

    # ── Derived ──────────────────────────────────────────
    MAX_CONTENT_LENGTH = MAX_UPLOAD_SIZE_MB * 1024 * 1024  # bytes

    @classmethod
    def validate(cls):
        """Check that critical configuration is present."""
        warnings = []
        if not cls.OPENROUTER_API_KEY or cls.OPENROUTER_API_KEY.startswith("your-"):
            warnings.append("OPENROUTER_API_KEY is not set — Advanced analysis unavailable")
        if not cls.GROQ_API_KEY or cls.GROQ_API_KEY.startswith("your-"):
            warnings.append("GROQ_API_KEY is not set — Standard analysis unavailable")
        return warnings
