"""
Vision Intelligence Endpoints
Handles document upload, validation, and pipeline orchestration.
"""

from typing import Set
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from app.auth import get_correlation_id, verify_internal_service_key
from vision.config import settings
from vision.extraction.gemini import GeminiVisionProvider
from vision.pipeline import DocumentIntelligencePipeline
from vision.schemas import ExtractionResultDTO

router = APIRouter(prefix="/internal/v1/vision", tags=["Vision Intelligence"])

ALLOWED_MIME_TYPES: Set[str] = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


def get_vision_pipeline() -> DocumentIntelligencePipeline:
    """Dependency provider for DocumentIntelligencePipeline."""
    provider = GeminiVisionProvider()
    return DocumentIntelligencePipeline(provider=provider)


@router.post(
    "/yarn-slip",
    response_model=ExtractionResultDTO,
    summary="Extract and mathematically audit yarn weighing slip",
    status_code=status.HTTP_200_OK,
)
async def extract_yarn_slip(
    file: UploadFile = File(..., description="Yarn slip image file"),
    pipeline: DocumentIntelligencePipeline = Depends(get_vision_pipeline),
    _auth: str = Depends(verify_internal_service_key),
    correlation_id: str = Depends(get_correlation_id),
) -> ExtractionResultDTO:
    """
    Ingests a raw yarn slip image, performs Gate 0 quality check,
    OpenCV preprocessing, vision extraction, 8-level mathematical audit,
    and optional self-healing correction.
    """
    content_type = (file.content_type or "image/jpeg").lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: '{content_type}'. Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty",
        )

    max_size_bytes = settings.max_image_size_mb * 1024 * 1024
    if len(image_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size ({len(image_bytes) / (1024 * 1024):.1f}MB) exceeds limit of {settings.max_image_size_mb}MB",
        )

    result = await pipeline.process(
        image_bytes=image_bytes,
        mime_type=content_type,
    )
    return result
