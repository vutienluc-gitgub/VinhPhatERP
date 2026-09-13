"""
Gemini Vision Provider Implementation
Uses the official google-genai SDK with structured JSON Schema enforcement,
tenacity exponential backoff retries, and domain exception mapping.
"""

import asyncio
from typing import Optional
from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import ValidationError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from vision.config import settings
from vision.constants import MSG_GEMINI_API_KEY_NOT_CONFIGURED
from vision.exceptions import (
    SchemaValidationException,
    VisionProviderException,
    VisionProviderRateLimitException,
    VisionProviderTimeoutException,
)
from vision.extraction.base import VisionProvider
from vision.extraction.prompt import SYSTEM_EXTRACTION_PROMPT
from vision.logger import logger
from vision.schemas import RawVisionOutputSchema


class GeminiVisionProvider(VisionProvider):
    """Production-grade Gemini Vision Provider with structured output and resilience."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.gemini_api_key
        self.model_name = model_name or settings.gemini_model

        if not self.api_key:
            logger.warning("gemini_api_key_empty", msg="GEMINI_API_KEY is not configured")

        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    @retry(
        stop=stop_after_attempt(settings.gemini_max_retries),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((APIError, ValidationError, asyncio.TimeoutError)),
        reraise=True,
    )
    async def extract(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        prompt_override: Optional[str] = None,
    ) -> RawVisionOutputSchema:
        """
        Executes an extraction call to Gemini with structured output.
        Retries automatically on network issues, 429 rate limits, and JSON validation errors.
        """
        if not self.client:
            raise VisionProviderException(MSG_GEMINI_API_KEY_NOT_CONFIGURED)

        prompt_text = prompt_override or SYSTEM_EXTRACTION_PROMPT

        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RawVisionOutputSchema,
            temperature=0.1,  # Low temperature for deterministic visual extraction
        )

        try:
            logger.debug(
                "calling_gemini_vision",
                model=self.model_name,
                image_size_kb=len(image_bytes) // 1024,
            )

            # Enforce async timeout
            response = await asyncio.wait_for(
                self.client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[image_part, prompt_text],
                    config=config,
                ),
                timeout=settings.gemini_timeout_sec,
            )

            if not response.text:
                raise VisionProviderException("Gemini returned an empty response body.")

            # Validate against Pydantic schema
            parsed_result = RawVisionOutputSchema.model_validate_json(response.text)

            logger.info(
                "gemini_vision_success",
                model=self.model_name,
                package_count=len(parsed_result.packages),
                declared_net_kg=parsed_result.declared_net_weight_kg,
            )
            return parsed_result

        except asyncio.TimeoutError as exc:
            logger.error("gemini_timeout", timeout=settings.gemini_timeout_sec)
            raise VisionProviderTimeoutException(
                f"Gemini API timed out after {settings.gemini_timeout_sec}s"
            ) from exc

        except APIError as exc:
            logger.error("gemini_api_error", code=exc.code, message=exc.message)
            if exc.code == 429:
                raise VisionProviderRateLimitException(
                    "Gemini API rate limit exceeded (429)."
                ) from exc
            raise VisionProviderException(f"Gemini API error: {exc.message}") from exc

        except ValidationError as exc:
            logger.error("gemini_schema_validation_error", error=str(exc))
            raise SchemaValidationException(
                f"Gemini structured output failed schema validation: {exc}"
            ) from exc

        except Exception as exc:
            logger.error("gemini_unexpected_error", error=str(exc))
            raise VisionProviderException(f"Unexpected vision extraction error: {exc}") from exc
