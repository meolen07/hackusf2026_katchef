from __future__ import annotations

import json
from functools import lru_cache
from typing import Annotated, List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "KatChef API"
    app_env: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    backend_cors_origins: Annotated[List[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:19006",
            "http://localhost:8081",
            "http://localhost:8082",
        ]
    )
    backend_cors_origin_regex: str = (
        r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
        r"|^https://.*githubpreview\.dev$"
        r"|^https://.*app\.github\.dev$"
        r"|^https://.*gitpod\.io$"
        r"|^https://.*exp\.direct$"
    )
    max_upload_size_mb: int = 8
    allowed_upload_content_types: Annotated[List[str], NoDecode] = Field(
        default_factory=lambda: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
        ]
    )

    firebase_project_id: str | None = None
    firebase_service_account_json: str | None = None
    google_application_credentials: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: float = 20.0
    chatbot_max_history: int = 4

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: str | List[str] | None) -> List[str]:
        if value in (None, ""):
            return []
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                parsed = json.loads(stripped)
                if not isinstance(parsed, list):
                    raise ValueError("BACKEND_CORS_ORIGINS must be a JSON array or comma-separated string.")
                return [str(origin).strip() for origin in parsed if str(origin).strip()]
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("allowed_upload_content_types", mode="before")
    @classmethod
    def parse_upload_content_types(cls, value: str | List[str] | None) -> List[str]:
        if value in (None, ""):
            return []
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                parsed = json.loads(stripped)
                if not isinstance(parsed, list):
                    raise ValueError("ALLOWED_UPLOAD_CONTENT_TYPES must be a JSON array or comma-separated string.")
                return [str(content_type).strip() for content_type in parsed if str(content_type).strip()]
            return [content_type.strip() for content_type in value.split(",") if content_type.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
