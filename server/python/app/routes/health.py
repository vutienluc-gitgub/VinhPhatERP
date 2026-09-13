"""
Health & Readiness Probes
Used by container orchestrators, monitoring tools, and load balancers.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Response, status
from vision.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Liveness Probe")
async def health_check() -> dict:
    """
    Returns liveness status of the Vision Microservice.
    """
    return {
        "status": "ok",
        "service": "vinhphat-vision-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


@router.get("/ready", summary="Readiness Probe")
async def readiness_check(response: Response) -> dict:
    """
    Checks if the service is ready to accept requests (e.g., API keys configured).
    """
    is_ready = bool(settings.gemini_api_key and settings.gemini_api_key.strip())
    
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "degraded",
            "reason": "GEMINI_API_KEY is not configured",
            "engine": settings.gemini_model,
        }

    return {
        "status": "ready",
        "engine": settings.gemini_model,
        "max_correction_attempts": settings.max_correction_attempts,
    }
