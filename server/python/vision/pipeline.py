"""
Document Intelligence Pipeline (Async Orchestrator)
Orchestrates Gate 0 Quality, OpenCV Preprocessing, Vision Extraction,
8-Level Mathematical Verification, and the Self-Healing Correction Loop.
"""

import time
from typing import Optional
from vision.config import settings
from vision.extraction.base import VisionProvider
from vision.extraction.prompt import build_self_healing_prompt
from vision.image.preprocess import preprocess_image
from vision.image.quality import check_image_quality
from vision.logger import logger
from vision.schemas import (
    EngineTelemetryDTO,
    ExtractionResultDTO,
)
from vision.validation.confidence import build_extraction_dto
from vision.validation.weights import validate_mathematical_integrity


class DocumentIntelligencePipeline:
    """End-to-End Orchestrator for Textile Weighing Slip Intelligence."""

    def __init__(
        self,
        provider: VisionProvider,
        enable_self_healing: bool = True,
        enable_deskew: bool = True,
        enable_clahe: bool = True,
    ):
        self.provider = provider
        self.enable_self_healing = enable_self_healing
        self.enable_deskew = enable_deskew
        self.enable_clahe = enable_clahe

    async def process(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
    ) -> ExtractionResultDTO:
        """
        Executes the full pipeline from raw image bytes to audited ExtractionResultDTO.
        """
        start_time = time.perf_counter()
        correction_attempts = 0

        logger.info(
            "pipeline_started",
            image_size_kb=len(image_bytes) // 1024,
            mime_type=mime_type,
        )

        # ----------------------------------------------------------------------
        # Step 1: Gate 0 Image Quality Check (< 150ms)
        # ----------------------------------------------------------------------
        quality_metrics = await check_image_quality(image_bytes, raise_on_failure=True)

        # ----------------------------------------------------------------------
        # Step 2: OpenCV Preprocessing (Deskew & CLAHE)
        # ----------------------------------------------------------------------
        preprocessed_bytes, deskew_angle = await preprocess_image(
            image_bytes,
            enable_deskew=self.enable_deskew,
            enable_clahe=self.enable_clahe,
        )
        quality_metrics.deskew_angle_degrees = deskew_angle

        # ----------------------------------------------------------------------
        # Step 3: Turn 1 - Vision Extraction
        # ----------------------------------------------------------------------
        raw_output = await self.provider.extract(preprocessed_bytes, mime_type=mime_type)

        # ----------------------------------------------------------------------
        # Step 4: 8-Level Mathematical Verification
        # ----------------------------------------------------------------------
        discrepancies, has_critical_error = validate_mathematical_integrity(raw_output)

        # ----------------------------------------------------------------------
        # Step 5: Self-Healing Correction Loop (Turn 2 on Math Error)
        # ----------------------------------------------------------------------
        if (
            has_critical_error
            and self.enable_self_healing
            and settings.max_correction_attempts > 0
        ):
            correction_attempts += 1
            error_prompts = [
                d.debug_prompt for d in discrepancies if d.severity == "ERROR"
            ]

            logger.warning(
                "triggering_self_healing_loop",
                attempt=correction_attempts,
                error_count=len(error_prompts),
            )

            correction_prompt = build_self_healing_prompt(raw_output, error_prompts)

            try:
                corrected_output = await self.provider.extract(
                    preprocessed_bytes,
                    mime_type=mime_type,
                    prompt_override=correction_prompt,
                )

                new_discrepancies, new_has_critical_error = validate_mathematical_integrity(
                    corrected_output
                )

                # If self-healing resolved errors or reduced discrepancies, adopt it
                if not new_has_critical_error or len(new_discrepancies) < len(discrepancies):
                    logger.info(
                        "self_healing_improved_results",
                        previous_errors=len(discrepancies),
                        new_errors=len(new_discrepancies),
                    )
                    raw_output = corrected_output
                    discrepancies = new_discrepancies
                else:
                    logger.info("self_healing_did_not_resolve_errors_keeping_original")

            except Exception as exc:
                logger.warning("self_healing_attempt_failed", error=str(exc))

        # ----------------------------------------------------------------------
        # Step 6: Build Validated DTO & Enforce Confidence Policies
        # ----------------------------------------------------------------------
        result_dto = build_extraction_dto(raw_output, discrepancies)

        # ----------------------------------------------------------------------
        # Step 7: Record Telemetry & Latency
        # ----------------------------------------------------------------------
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        result_dto.engine_telemetry = EngineTelemetryDTO(
            engine=settings.gemini_model,
            processing_duration_ms=duration_ms,
            correction_attempts=correction_attempts,
            quality_metrics=quality_metrics,
        )

        logger.info(
            "pipeline_completed",
            duration_ms=duration_ms,
            packages=len(result_dto.packages),
            needs_manual_review=result_dto.needs_manual_review,
            reasons_count=len(result_dto.review_reasons),
        )

        return result_dto
