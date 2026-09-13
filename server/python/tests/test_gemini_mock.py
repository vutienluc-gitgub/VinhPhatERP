"""
Pipeline & Self-Healing Mock Tests
Validates orchestrator lifecycle and Turn 2 correction loops with zero API tokens and zero network latency.
"""

from unittest.mock import AsyncMock
import pytest
from tests.test_quality_gate import create_synthetic_image
from vision.extraction.base import VisionProvider
from vision.pipeline import DocumentIntelligencePipeline
from vision.schemas import RawVisionOutputSchema, RawVisionPackageItem


@pytest.mark.asyncio
async def test_pipeline_happy_path():
    """Pipeline executes single turn extraction successfully when math is consistent."""
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

    pipeline = DocumentIntelligencePipeline(provider=mock_provider)
    image_bytes = create_synthetic_image()

    result = await pipeline.process(image_bytes)

    assert result.document.supplier_raw_name.value == "CÔNG TY CP DỆT MAY ĐÔNG NAM"
    assert result.summary.declared_net_weight_kg.value == 1000.0
    assert len(result.packages) == 2
    assert result.needs_manual_review is False
    assert result.engine_telemetry.correction_attempts == 0
    assert mock_provider.extract.call_count == 1


@pytest.mark.asyncio
async def test_pipeline_self_healing_turn_2():
    """
    Tests Self-Healing Loop:
    Turn 1 has a 50kg discrepancy.
    Pipeline catches it and invokes Turn 2 with correction prompt.
    Turn 2 returns corrected data -> Pipeline finishes cleanly!
    """
    turn_1_faulty = RawVisionOutputSchema(
        gross_weight_kg=1050.0,
        tare_weight_kg=50.0,
        declared_net_weight_kg=1000.0,
        package_count=2,
        packages=[
            RawVisionPackageItem(package_index=1, net_kg=450.0),  # Sum = 950kg, off by 50kg
            RawVisionPackageItem(package_index=2, net_kg=500.0),
        ],
    )

    turn_2_corrected = RawVisionOutputSchema(
        gross_weight_kg=1050.0,
        tare_weight_kg=50.0,
        declared_net_weight_kg=1000.0,
        package_count=2,
        packages=[
            RawVisionPackageItem(package_index=1, net_kg=500.0),  # Corrected to 500kg
            RawVisionPackageItem(package_index=2, net_kg=500.0),
        ],
        field_confidences={
            "supplier_raw_name": 0.98,
            "document_number": 0.99,
            "document_date": 0.99,
            "declared_net_weight_kg": 0.99,
        },
    )

    mock_provider = AsyncMock(spec=VisionProvider)
    mock_provider.extract.side_effect = [turn_1_faulty, turn_2_corrected]

    pipeline = DocumentIntelligencePipeline(provider=mock_provider, enable_self_healing=True)
    image_bytes = create_synthetic_image()

    result = await pipeline.process(image_bytes)

    # Assert Turn 2 was triggered
    assert mock_provider.extract.call_count == 2
    assert result.engine_telemetry.correction_attempts == 1
    assert result.needs_manual_review is False
    assert sum(p.net_kg for p in result.packages) == 1000.0
