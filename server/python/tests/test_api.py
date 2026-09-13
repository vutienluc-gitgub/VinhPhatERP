"""
API & Microservice Integration Tests
Tests FastAPI routing, security guard (X-Internal-Service-Key), correlation tracing,
Gate 0 quality rejections, and end-to-end extraction responses.
"""

from unittest.mock import AsyncMock
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.routes.vision import get_vision_pipeline
from tests.test_quality_gate import create_synthetic_image
from vision.config import settings
from vision.exceptions import (
    VisionProviderRateLimitException,
    VisionProviderTimeoutException,
)
from vision.extraction.base import VisionProvider
from vision.pipeline import DocumentIntelligencePipeline
from vision.schemas import RawVisionOutputSchema, RawVisionPackageItem

VALID_KEY = settings.internal_service_key


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """Async test client using httpx ASGITransport."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """GET /health returns 200 and liveness payload."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "vinhphat-vision-service"
    assert "timestamp" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_readiness_endpoint_configured(client: AsyncClient, monkeypatch):
    """GET /ready returns 200 when GEMINI_API_KEY is configured."""
    monkeypatch.setattr(settings, "gemini_api_key", "test-mock-api-key")
    response = await client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "engine" in data


@pytest.mark.asyncio
async def test_readiness_endpoint_unconfigured(client: AsyncClient, monkeypatch):
    """GET /ready returns 503 when GEMINI_API_KEY is missing."""
    monkeypatch.setattr(settings, "gemini_api_key", "")
    response = await client.get("/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
    assert "reason" in data


@pytest.mark.asyncio
async def test_auth_guard_rejects_missing_key(client: AsyncClient):
    """Endpoints require X-Internal-Service-Key, returning 401 when missing."""
    img_bytes = create_synthetic_image(blur=False)
    response = await client.post(
        "/internal/v1/vision/yarn-slip",
        files={"file": ("slip.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 401
    assert "X-Internal-Service-Key" in response.json()["detail"]


@pytest.mark.asyncio
async def test_auth_guard_rejects_invalid_key(client: AsyncClient):
    """Endpoints return 401 when X-Internal-Service-Key is incorrect."""
    img_bytes = create_synthetic_image(blur=False)
    response = await client.post(
        "/internal/v1/vision/yarn-slip",
        headers={"X-Internal-Service-Key": "wrong-secret-key"},
        files={"file": ("slip.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 401
    assert "Invalid internal service key" in response.json()["detail"]


@pytest.mark.asyncio
async def test_unsupported_mime_type(client: AsyncClient):
    """Uploads with invalid MIME types are rejected with 400 Bad Request."""
    response = await client.post(
        "/internal/v1/vision/yarn-slip",
        headers={"X-Internal-Service-Key": VALID_KEY},
        files={"file": ("document.pdf", b"%PDF-1.4...", "application/pdf")},
    )
    assert response.status_code == 400
    assert "Unsupported image type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_empty_file_rejected(client: AsyncClient):
    """Empty file upload is rejected with 400 Bad Request."""
    response = await client.post(
        "/internal/v1/vision/yarn-slip",
        headers={"X-Internal-Service-Key": VALID_KEY},
        files={"file": ("empty.jpg", b"", "image/jpeg")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_quality_gate_rejection_returns_422(client: AsyncClient):
    """Severe blurred image fails Gate 0 and returns 422 with guidance."""
    blurred_img = create_synthetic_image(blur=True)
    response = await client.post(
        "/internal/v1/vision/yarn-slip",
        headers={"X-Internal-Service-Key": VALID_KEY},
        files={"file": ("blurred.jpg", blurred_img, "image/jpeg")},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"] == "QualityGateRejectedException"
    assert "user_guidance" in data["details"]
    assert "blur_score" in data["details"]


@pytest.mark.asyncio
async def test_yarn_slip_extraction_success(client: AsyncClient):
    """Upload valid slip returns 200 OK with full ExtractionResultDTO schema."""
    mock_provider = AsyncMock(spec=VisionProvider)
    mock_provider.extract.return_value = RawVisionOutputSchema(
        supplier_raw_name="CÔNG TY CP DỆT MAY ĐÔNG NAM",
        document_number="PC-0012",
        document_date="2026-09-12",
        gross_weight_kg=1050.0,
        tare_weight_kg=50.0,
        declared_net_weight_kg=1000.0,
        package_count=2,
        packages=[
            RawVisionPackageItem(package_index=1, net_kg=500.0),
            RawVisionPackageItem(package_index=2, net_kg=500.0),
        ],
        field_confidences={
            "supplier_raw_name": 0.98,
            "document_number": 0.99,
            "document_date": 0.99,
            "declared_net_weight_kg": 0.99,
        },
    )

    test_pipeline = DocumentIntelligencePipeline(provider=mock_provider)
    app.dependency_overrides[get_vision_pipeline] = lambda: test_pipeline

    try:
        sharp_img = create_synthetic_image(blur=False)
        response = await client.post(
            "/internal/v1/vision/yarn-slip",
            headers={
                "X-Internal-Service-Key": VALID_KEY,
                "X-Correlation-ID": "test-trace-uuid-12345",
            },
            files={"file": ("sharp_slip.jpg", sharp_img, "image/jpeg")},
        )

        assert response.status_code == 200
        assert response.headers.get("X-Correlation-ID") == "test-trace-uuid-12345"

        data = response.json()
        assert data["document"]["supplier_raw_name"]["value"] == "CÔNG TY CP DỆT MAY ĐÔNG NAM"
        assert data["summary"]["declared_net_weight_kg"]["value"] == 1000.0
        assert len(data["packages"]) == 2
        assert data["needs_manual_review"] is False
        assert "engine_telemetry" in data
        assert data["engine_telemetry"]["engine"] == "gemini-2.5-flash"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upstream_timeout_exception_returns_504(client: AsyncClient):
    """Vision Provider timeout returns 504 Gateway Timeout."""
    mock_provider = AsyncMock(spec=VisionProvider)
    mock_provider.extract.side_effect = VisionProviderTimeoutException(
        "Gemini API request timed out after 30 seconds"
    )

    test_pipeline = DocumentIntelligencePipeline(provider=mock_provider)
    app.dependency_overrides[get_vision_pipeline] = lambda: test_pipeline

    try:
        sharp_img = create_synthetic_image(blur=False)
        response = await client.post(
            "/internal/v1/vision/yarn-slip",
            headers={"X-Internal-Service-Key": VALID_KEY},
            files={"file": ("slip.jpg", sharp_img, "image/jpeg")},
        )
        assert response.status_code == 504
        data = response.json()
        assert data["error"] == "VisionProviderTimeoutException"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upstream_rate_limit_exception_returns_429(client: AsyncClient):
    """Vision Provider rate limit returns 429 Too Many Requests."""
    mock_provider = AsyncMock(spec=VisionProvider)
    mock_provider.extract.side_effect = VisionProviderRateLimitException(
        "Gemini API rate limit exceeded (429 ResourceExhausted)"
    )

    test_pipeline = DocumentIntelligencePipeline(provider=mock_provider)
    app.dependency_overrides[get_vision_pipeline] = lambda: test_pipeline

    try:
        sharp_img = create_synthetic_image(blur=False)
        response = await client.post(
            "/internal/v1/vision/yarn-slip",
            headers={"X-Internal-Service-Key": VALID_KEY},
            files={"file": ("slip.jpg", sharp_img, "image/jpeg")},
        )
        assert response.status_code == 429
        data = response.json()
        assert data["error"] == "VisionProviderRateLimitException"
    finally:
        app.dependency_overrides.clear()
