from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.config.settings import get_settings
from backend.models.schemas import VisionDetectResponse
from backend.services.vision_service import detect_ingredients_from_image

router = APIRouter(prefix="/vision", tags=["vision"])
settings = get_settings()
ALLOWED_UPLOAD_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}


@router.post("/detect", response_model=VisionDetectResponse)
async def detect_ingredients(file: UploadFile = File(...)) -> VisionDetectResponse:
    file_extension = Path(file.filename or "").suffix.lower()
    if (
        file.content_type not in settings.allowed_upload_content_types
        and file_extension not in ALLOWED_UPLOAD_EXTENSIONS
    ):
        raise HTTPException(
            status_code=415,
            detail=(
                "Unsupported image type. Upload a JPG, PNG, WEBP, or HEIC image before running KatLens."
            ),
        )

    max_upload_size_bytes = settings.max_upload_size_mb * 1024 * 1024
    image_bytes = await file.read(max_upload_size_bytes + 1)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")
    if len(image_bytes) > max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image is too large. Keep uploads under {settings.max_upload_size_mb} MB.",
        )

    try:
        return detect_ingredients_from_image(image_bytes=image_bytes, filename=file.filename)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
