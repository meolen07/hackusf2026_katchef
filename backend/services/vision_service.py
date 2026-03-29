from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Iterable

from google.oauth2 import service_account

from backend.config.settings import get_settings
from backend.models.schemas import IngredientRecord, VisionDetectResponse

logger = logging.getLogger(__name__)

INGREDIENT_KEYWORDS: dict[str, str] = {
    "apple": "Fruit",
    "avocado": "Fruit",
    "banana": "Fruit",
    "bell pepper": "Vegetable",
    "broccoli": "Vegetable",
    "butter": "Dairy",
    "carrot": "Vegetable",
    "cheese": "Dairy",
    "chicken": "Protein",
    "cucumber": "Vegetable",
    "egg": "Protein",
    "garlic": "Seasoning",
    "ginger": "Seasoning",
    "lettuce": "Vegetable",
    "lime": "Fruit",
    "milk": "Dairy",
    "mushroom": "Vegetable",
    "onion": "Vegetable",
    "orange": "Fruit",
    "pasta": "Pantry",
    "potato": "Vegetable",
    "rice": "Pantry",
    "salmon": "Protein",
    "spinach": "Vegetable",
    "strawberry": "Fruit",
    "tomato": "Vegetable",
    "tofu": "Protein",
    "yogurt": "Dairy",
    "zucchini": "Vegetable",
}

def _load_google_credentials():
    settings = get_settings()

    if settings.firebase_service_account_json:
        try:
            service_account_info = json.loads(settings.firebase_service_account_json)
        except json.JSONDecodeError as exc:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.") from exc
        return service_account.Credentials.from_service_account_info(service_account_info)

    if settings.google_application_credentials:
        credentials_path = Path(settings.google_application_credentials).expanduser()
        if not credentials_path.exists():
            raise FileNotFoundError(
                f"Google application credentials file not found: {credentials_path}"
            )
        if credentials_path.stat().st_size == 0:
            raise ValueError(
                f"Google application credentials file is empty: {credentials_path}"
            )
        return service_account.Credentials.from_service_account_file(str(credentials_path))

    return None


def _build_vision_error_message(exc: Exception) -> str:
    message = str(exc)
    normalized = message.upper()

    if "BILLING_DISABLED" in normalized:
        return (
            "Google Vision billing is disabled for this project. "
            "Enable billing in Google Cloud, wait a few minutes, then try the scan again."
        )

    if "SERVICE_DISABLED" in normalized:
        return (
            "Google Vision API is disabled for this project. "
            "Enable the Vision API in Google Cloud, then try the scan again."
        )

    if "DNS RESOLUTION FAILED" in normalized or "COULD NOT CONTACT DNS SERVERS" in normalized:
        return (
            "KatChef's backend could not reach Google Vision. "
            "Check the backend network connection, then try again."
        )

    if "INVALID_ARGUMENT" in normalized:
        return (
            "Google Vision rejected this image. "
            "Try a clearer photo or a standard JPG/PNG image, then scan again."
        )

    return "Google Vision request failed. Check credentials and backend logs."


def _match_ingredient(label: str, score: float) -> IngredientRecord | None:
    normalized = label.lower().strip()
    for keyword, category in INGREDIENT_KEYWORDS.items():
        if keyword in normalized or normalized in keyword:
            quantity = "1 item"
            if category == "Dairy":
                quantity = "1 pack"
            if category == "Pantry":
                quantity = "1 pack"
            return IngredientRecord(
                name=label.title(),
                quantity=quantity,
                category=category,
                confidence=min(max(score, 0.5), 0.99),
            )
    return None


def _unique_records(records: Iterable[IngredientRecord]) -> list[IngredientRecord]:
    seen: set[str] = set()
    unique: list[IngredientRecord] = []
    for record in records:
        key = record.name.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(record)
    return unique


def _google_vision_detect(image_bytes: bytes) -> VisionDetectResponse:
    from google.cloud import vision

    client_kwargs: dict[str, object] = {}
    credentials_obj = _load_google_credentials()
    if credentials_obj is not None:
        client_kwargs["credentials"] = credentials_obj

    client = vision.ImageAnnotatorClient(**client_kwargs)
    image = vision.Image(content=image_bytes)
    response = client.label_detection(image=image)

    if response.error.message:
        raise RuntimeError(response.error.message)

    records = [
        match
        for label in response.label_annotations
        if (match := _match_ingredient(label.description, label.score))
    ]

    if not records:
        object_response = client.object_localization(image=image)
        records = [
            match
            for obj in object_response.localized_object_annotations
            if (match := _match_ingredient(obj.name, obj.score))
        ]

    records = sorted(_unique_records(records), key=lambda item: item.confidence, reverse=True)
    return VisionDetectResponse(ingredients=records[:8])


def detect_ingredients_from_image(image_bytes: bytes, filename: str | None = None) -> VisionDetectResponse:
    del filename
    try:
        detected = _google_vision_detect(image_bytes)
        if detected.ingredients:
            return detected
    except Exception as exc:
        logger.warning("Vision detection failed: %s", exc)
        raise RuntimeError(_build_vision_error_message(exc)) from exc

    return VisionDetectResponse(ingredients=[])
