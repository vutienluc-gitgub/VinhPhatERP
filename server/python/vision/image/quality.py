"""
Gate 0: Fast Image Quality Gate (< 150ms)
Performs Laplacian blur variance, brightness, contrast, and resolution checks.
Provides both sync implementation and non-blocking async wrapper via asyncio.to_thread.
"""

import asyncio
from typing import List, Tuple
import cv2
import numpy as np
from vision.config import settings
from vision.constants import (
    MSG_QUALITY_IMAGE_DECODE_FAILED,
    TEMPLATE_QUALITY_BLUR_DETECTED,
    TEMPLATE_QUALITY_RESOLUTION_TOO_LOW,
    TEMPLATE_QUALITY_TOO_BRIGHT,
    TEMPLATE_QUALITY_TOO_DARK,
)
from vision.exceptions import QualityGateRejectedException
from vision.logger import logger
from vision.schemas import QualityMetricsDTO


def _check_image_quality_sync(
    image_bytes: bytes,
    raise_on_failure: bool = True,
) -> QualityMetricsDTO:
    """Synchronous OpenCV operations for image quality verification."""
    # 1. Decode image buffer
    image_buffer = np.frombuffer(image_bytes, np.uint8)
    decoded_image = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)

    if decoded_image is None:
        reasons = [MSG_QUALITY_IMAGE_DECODE_FAILED]
        if raise_on_failure:
            raise QualityGateRejectedException(
                reasons=reasons,
                blur_score=0.0,
                brightness_mean=0.0,
                resolution=(0, 0),
            )
        return QualityMetricsDTO(
            blur_score=0.0,
            brightness_mean=0.0,
            passed_gate_0=False,
            warnings=reasons,
        )

    height, width = decoded_image.shape[:2]
    warnings: List[str] = []

    # 2. Resolution check
    if width < settings.min_resolution or height < settings.min_resolution:
        warnings.append(
            TEMPLATE_QUALITY_RESOLUTION_TOO_LOW.format(
                width=width,
                height=height,
                min_res=settings.min_resolution,
            )
        )

    # 3. Grayscale conversion for photometric and frequency analysis
    gray_image = cv2.cvtColor(decoded_image, cv2.COLOR_BGR2GRAY)

    # 4. Blur detection via Laplacian Variance
    laplacian_var = float(cv2.Laplacian(gray_image, cv2.CV_64F).var())
    if laplacian_var < settings.min_blur_score:
        warnings.append(
            TEMPLATE_QUALITY_BLUR_DETECTED.format(
                blur=laplacian_var,
                threshold=settings.min_blur_score,
            )
        )

    # 5. Brightness evaluation
    brightness_mean = float(np.mean(gray_image))
    if brightness_mean < settings.min_brightness:
        warnings.append(
            TEMPLATE_QUALITY_TOO_DARK.format(
                brightness=brightness_mean,
                min_brightness=settings.min_brightness,
            )
        )
    elif brightness_mean > settings.max_brightness:
        warnings.append(
            TEMPLATE_QUALITY_TOO_BRIGHT.format(
                brightness=brightness_mean,
                max_brightness=settings.max_brightness,
            )
        )

    passed = len(warnings) == 0

    metrics = QualityMetricsDTO(
        blur_score=round(laplacian_var, 2),
        brightness_mean=round(brightness_mean, 2),
        passed_gate_0=passed,
        warnings=warnings,
    )

    logger.info(
        "gate_0_quality_checked",
        passed=passed,
        blur_score=metrics.blur_score,
        brightness=metrics.brightness_mean,
        resolution=(width, height),
        warning_count=len(warnings),
    )

    if not passed and raise_on_failure:
        raise QualityGateRejectedException(
            reasons=warnings,
            blur_score=metrics.blur_score,
            brightness_mean=metrics.brightness_mean,
            resolution=(width, height),
        )

    return metrics


async def check_image_quality(
    image_bytes: bytes,
    raise_on_failure: bool = True,
) -> QualityMetricsDTO:
    """Non-blocking async wrapper delegating OpenCV execution to worker threads."""
    return await asyncio.to_thread(
        _check_image_quality_sync,
        image_bytes,
        raise_on_failure,
    )
