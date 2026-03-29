from __future__ import annotations

import json
import logging
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

from backend.config.settings import get_settings

logger = logging.getLogger(__name__)


def _parse_service_account_json(raw_json: str) -> dict[str, object]:
    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.") from exc
    if not isinstance(parsed, dict) or not parsed:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT_JSON must contain a non-empty JSON object.")
    return parsed


def _resolve_credentials_path(raw_path: str) -> Path:
    credentials_path = Path(raw_path).expanduser()
    if not credentials_path.exists():
        raise FileNotFoundError(
            f"Google application credentials file not found: {credentials_path}"
        )
    if credentials_path.stat().st_size == 0:
        raise ValueError(
            f"Google application credentials file is empty: {credentials_path}"
        )
    return credentials_path


def has_google_credentials_configured() -> bool:
    settings = get_settings()

    if settings.firebase_service_account_json:
        try:
            _parse_service_account_json(settings.firebase_service_account_json)
            return True
        except ValueError:
            return False

    if settings.google_application_credentials:
        credentials_path = Path(settings.google_application_credentials).expanduser()
        return credentials_path.exists() and credentials_path.stat().st_size > 0

    return False


def _build_firebase_credential(settings) -> credentials.Base | None:
    if settings.firebase_service_account_json:
        service_account = _parse_service_account_json(settings.firebase_service_account_json)
        return credentials.Certificate(service_account)

    if settings.google_application_credentials:
        credentials_path = _resolve_credentials_path(settings.google_application_credentials)
        return credentials.Certificate(str(credentials_path))

    return None


def initialize_firebase() -> bool:
    settings = get_settings()

    if firebase_admin._apps:
        return True

    try:
        options: dict[str, str] | None = None
        if settings.firebase_project_id:
            options = {"projectId": settings.firebase_project_id}

        credential = _build_firebase_credential(settings)
        if credential:
            firebase_admin.initialize_app(credential, options=options)
        else:
            firebase_admin.initialize_app(options=options)

        return True
    except Exception as exc:
        logger.warning("Firebase initialization skipped: %s", exc)
        return False


def get_firestore_client() -> firestore.Client | None:
    if not initialize_firebase():
        return None

    try:
        return firestore.client()
    except Exception as exc:
        logger.warning("Firestore client unavailable: %s", exc)
        return None
