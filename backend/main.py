from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config.firebase import has_google_credentials_configured, initialize_firebase
from backend.config.settings import get_settings
from backend.models.schemas import HealthResponse
from backend.routers import chatbot, vision

settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    firebase_enabled = initialize_firebase()
    logger.info(
        "Starting KatChef API env=%s host=%s port=%s firebase=%s gemini=%s vision=%s cors_origins=%s",
        settings.app_env,
        settings.host,
        settings.port,
        firebase_enabled,
        bool(settings.gemini_api_key),
        has_google_credentials_configured(),
        len(settings.backend_cors_origins),
    )
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_origin_regex=settings.backend_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vision.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    google_credentials_configured = has_google_credentials_configured()
    chatbot_configured = bool(settings.gemini_api_key)

    return HealthResponse(
        app_name=settings.app_name,
        environment=settings.app_env,
        host=settings.host,
        port=settings.port,
        firebase_enabled=initialize_firebase(),
        google_credentials_configured=google_credentials_configured,
        vision_configured=google_credentials_configured,
        chatbot_configured=chatbot_configured,
        max_upload_size_mb=settings.max_upload_size_mb,
        cors_origins=settings.backend_cors_origins,
    )
