"""
Abstract Vision Provider Interface (Clean Architecture Adapter)
Allows swapping Gemini with Claude Vision, PaddleOCR, or OpenAI without altering pipeline logic.
"""

from abc import ABC, abstractmethod
from typing import Optional
from vision.schemas import RawVisionOutputSchema


class VisionProvider(ABC):
    """Abstract Base Class for Vision OCR adapters."""

    @abstractmethod
    async def extract(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        prompt_override: Optional[str] = None,
    ) -> RawVisionOutputSchema:
        """
        Extracts structured document entities from image bytes.
        Must return a validated RawVisionOutputSchema or raise a VisionProviderException.
        """
        pass
