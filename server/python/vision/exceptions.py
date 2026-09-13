"""
Domain Exceptions for VinhPhatERP Vision Pipeline
Mapped cleanly to HTTP Status Codes for FastAPI integration.
"""

from typing import Any, Dict, List, Optional
from vision.constants import MSG_QUALITY_GATE_USER_GUIDANCE


class VisionEngineException(Exception):
    """Base exception for all Vision Engine domain errors."""
    http_status_code: int = 500

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class QualityGateRejectedException(VisionEngineException):
    """Raised when an uploaded document fails Gate 0 quality checks (< 150ms)."""
    http_status_code: int = 422

    def __init__(
        self,
        reasons: List[str],
        blur_score: float,
        brightness_mean: float,
        resolution: tuple[int, int],
    ):
        message = f"Image failed Quality Gate 0: {'; '.join(reasons)}"
        super().__init__(
            message,
            details={
                "reasons": reasons,
                "blur_score": blur_score,
                "brightness_mean": brightness_mean,
                "resolution": resolution,
                "user_guidance": MSG_QUALITY_GATE_USER_GUIDANCE,
            },
        )
        self.reasons = reasons


class VisionProviderException(VisionEngineException):
    """Raised when an upstream Vision Provider (e.g. Gemini, Paddle) fails."""
    http_status_code: int = 502


class VisionProviderTimeoutException(VisionProviderException):
    """Raised when the Vision API exceeds configured timeout limits."""
    http_status_code: int = 504


class VisionProviderRateLimitException(VisionProviderException):
    """Raised when encountering HTTP 429 / Rate Limit from AI Provider."""
    http_status_code: int = 429


class SchemaValidationException(VisionEngineException):
    """Raised when vision output fails strict Pydantic parsing after retries."""
    http_status_code: int = 502
