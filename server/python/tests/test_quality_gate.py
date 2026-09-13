"""
Unit Tests for Gate 0 Image Quality Evaluation
Tests Laplacian blur variance, resolution checks, and brightness gates using synthetic images.
"""

import cv2
import numpy as np
import pytest
from vision.exceptions import QualityGateRejectedException
from vision.image.quality import check_image_quality


def create_synthetic_image(
    width: int = 1000,
    height: int = 1000,
    blur: bool = False,
    brightness: int = 150,
) -> bytes:
    """Generates synthetic image with sharp lines/text or blurred pixels."""
    img = np.full((height, width, 3), brightness, dtype=np.uint8)

    # Draw high-contrast text and grid lines
    for y in range(50, height, 100):
        cv2.line(img, (50, y), (width - 50, y), (0, 0, 0), 2)
    cv2.putText(
        img,
        "PHIEU CAN SOI VINH PHAT - NET 1000KG",
        (100, 200),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.0,
        (0, 0, 0),
        2,
    )

    if blur:
        # Severe Gaussian blur to simulate shaking hand
        img = cv2.GaussianBlur(img, (35, 35), 0)

    success, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


@pytest.mark.asyncio
async def test_sharp_image_passes_gate_0():
    """Sharp, well-lit image passes Gate 0 with high blur score."""
    img_bytes = create_synthetic_image(blur=False)
    metrics = await check_image_quality(img_bytes, raise_on_failure=False)
    assert metrics.passed_gate_0 is True
    assert metrics.blur_score >= 100.0
    assert len(metrics.warnings) == 0


@pytest.mark.asyncio
async def test_blurred_image_rejected_at_gate_0():
    """Blurred image is detected and rejected with informative guidance."""
    img_bytes = create_synthetic_image(blur=True)

    # Without raising
    metrics = await check_image_quality(img_bytes, raise_on_failure=False)
    assert metrics.passed_gate_0 is False
    assert metrics.blur_score < 100.0
    assert any("nhòe" in w.lower() or "mờ" in w.lower() for w in metrics.warnings)

    # With exception raising
    with pytest.raises(QualityGateRejectedException) as exc_info:
        await check_image_quality(img_bytes, raise_on_failure=True)
    assert exc_info.value.http_status_code == 422


@pytest.mark.asyncio
async def test_low_resolution_image_rejected():
    """Image below 800x800 is flagged."""
    img_bytes = create_synthetic_image(width=400, height=400, blur=False)
    metrics = await check_image_quality(img_bytes, raise_on_failure=False)
    assert metrics.passed_gate_0 is False
    assert any("độ phân giải" in w.lower() for w in metrics.warnings)
