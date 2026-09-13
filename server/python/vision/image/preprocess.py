"""
OpenCV Image Preprocessing Pipeline
Provides Deskew angle correction and CLAHE contrast enhancement for dot-matrix/faded print.
All heavy image transformations run in background worker threads via asyncio.to_thread.
"""

import asyncio
from typing import Tuple
import cv2
import numpy as np
from vision.constants import (
    CLAHE_CLIP_LIMIT,
    CLAHE_TILE_GRID_SIZE,
    DESKEW_MAX_ANGLE_DEG,
    DESKEW_MIN_ANGLE_DEG,
    DESKEW_MIN_FEATURE_POINTS,
    JPEG_ENCODE_QUALITY,
)
from vision.logger import logger


def _preprocess_image_sync(
    image_bytes: bytes,
    enable_deskew: bool = True,
    enable_clahe: bool = True,
) -> Tuple[bytes, float]:
    """
    Synchronous image preprocessing:
    1. Angle estimation and deskewing
    2. Adaptive contrast enhancement (CLAHE) on LAB color space
    Returns: (preprocessed_jpeg_bytes, deskew_angle_degrees)
    """
    image_buffer = np.frombuffer(image_bytes, np.uint8)
    decoded_image = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)
    if decoded_image is None:
        return image_bytes, 0.0

    deskew_angle = 0.0

    # 1. Deskewing
    if enable_deskew:
        gray_image = cv2.cvtColor(decoded_image, cv2.COLOR_BGR2GRAY)
        # Invert colors for text line detection
        thresh = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) > DESKEW_MIN_FEATURE_POINTS:
            angle = cv2.minAreaRect(coords)[-1]
            # Normalization of OpenCV angle
            if angle < -45:
                angle = -(90 + angle)
            elif angle > 45:
                angle = 90 - angle
            else:
                angle = -angle

            # Only rotate if the skew is subtle but perceptible (0.5 to 30 deg)
            if DESKEW_MIN_ANGLE_DEG <= abs(angle) <= DESKEW_MAX_ANGLE_DEG:
                deskew_angle = float(angle)
                (height, width) = decoded_image.shape[:2]
                center = (width // 2, height // 2)
                matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                decoded_image = cv2.warpAffine(
                    decoded_image,
                    matrix,
                    (width, height),
                    flags=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE,
                )

    # 2. CLAHE on LAB luminance channel (sharpens faded blue ink and dot-matrix needles)
    if enable_clahe:
        lab_image = cv2.cvtColor(decoded_image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab_image)
        clahe = cv2.createCLAHE(clipLimit=CLAHE_CLIP_LIMIT, tileGridSize=CLAHE_TILE_GRID_SIZE)
        cl = clahe.apply(l_channel)
        enhanced_lab = cv2.merge((cl, a_channel, b_channel))
        decoded_image = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    # Encode back to high-quality JPEG
    success, encoded = cv2.imencode(
        ".jpg", decoded_image, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_ENCODE_QUALITY]
    )
    if not success:
        return image_bytes, deskew_angle

    logger.debug(
        "image_preprocessed",
        deskew_angle=round(deskew_angle, 2),
        clahe_applied=enable_clahe,
    )

    return encoded.tobytes(), round(deskew_angle, 2)


async def preprocess_image(
    image_bytes: bytes,
    enable_deskew: bool = True,
    enable_clahe: bool = True,
) -> Tuple[bytes, float]:
    """Async wrapper for non-blocking execution of OpenCV preprocessing."""
    return await asyncio.to_thread(
        _preprocess_image_sync,
        image_bytes,
        enable_deskew,
        enable_clahe,
    )
