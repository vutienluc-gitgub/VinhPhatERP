"""
Internal Security Guard & Request Tracing
Enforces X-Internal-Service-Key check and manages X-Correlation-ID tracing.
"""

import secrets
import uuid
from typing import Optional
from fastapi import Header, HTTPException, status
import structlog
from vision.config import settings


def verify_internal_service_key(
    x_internal_service_key: Optional[str] = Header(default=None, alias="X-Internal-Service-Key"),
) -> str:
    """
    Verifies that the incoming request contains the correct X-Internal-Service-Key.
    Uses constant-time comparison to prevent timing attacks.
    """
    if not x_internal_service_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required X-Internal-Service-Key header",
        )

    expected_key = settings.internal_service_key
    if not secrets.compare_digest(x_internal_service_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service key",
        )

    return x_internal_service_key


def get_correlation_id(
    x_correlation_id: Optional[str] = Header(default=None, alias="X-Correlation-ID"),
) -> str:
    """
    Extracts or generates a correlation ID for end-to-end request tracing.
    Binds the correlation ID to structlog contextvars.
    """
    correlation_id = x_correlation_id if x_correlation_id and x_correlation_id.strip() else uuid.uuid4().hex
    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
    return correlation_id
