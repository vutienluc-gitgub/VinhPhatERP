"""
Ground Truth Benchmark & Evaluation Suite
Runs automated compliance checks against the 6 labeled samples in datasets/yarn-slip/v1/.
"""

import json
from pathlib import Path
import pytest
from vision.config import settings
from vision.schemas import RawVisionOutputSchema, RawVisionPackageItem
from vision.validation.weights import validate_mathematical_integrity

WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
DATASET_ROOT = WORKSPACE_ROOT / "datasets" / "yarn-slip" / "v1"


def load_manifest() -> dict:
    manifest_file = DATASET_ROOT / "manifest.json"
    if not manifest_file.exists():
        pytest.skip("manifest.json not found")
    with open(manifest_file, "r", encoding="utf-8") as f:
        return json.load(f)


def convert_ground_truth(sample_id: str, raw_json: dict) -> RawVisionOutputSchema:
    """Converts diverse real-world ground truth JSON formats to normalized RawVisionOutputSchema."""
    gt = raw_json["ground_truth"]
    summary = gt.get("summary", {})

    doc_type = raw_json.get("document_type", "DELIVERY_NOTE")
    supp = gt.get("supplier", {}) or gt.get("issuer", {})
    supp_name = supp.get("canonical_name") or supp.get("raw_text") or supp.get("company_name")
    doc_number = gt.get("document_number")
    doc_date = gt.get("document_date")

    declared_net = (
        summary.get("declared_net_weight_kg")
        or summary.get("grand_total_weight_kg")
        or summary.get("total_weight_kg")
        or summary.get("calculated_net_weight_kg")
        or gt.get("math_verification", {}).get("total_weight_sum_kg")
    )

    package_count = (
        summary.get("package_count")
        or summary.get("grand_total_roll_count")
        or summary.get("grand_total_items")
        or summary.get("total_packages_count")
    )

    packages = []
    idx = 1
    if "packages" in gt:  # YS-0002
        for p in gt["packages"]:
            if p.get("net_kg") is not None:
                packages.append(
                    RawVisionPackageItem(
                        package_index=idx,
                        net_kg=p["net_kg"],
                        item_type="PACKAGE",
                    )
                )
                idx += 1
    elif "items" in gt:  # YS-0001
        for item in gt["items"]:
            item_type = "ACCESSORY" if "bo" in item.get("item_name", "").lower() else "PACKAGE"
            for roll_kg in item.get("details_rolls_kg", []):
                packages.append(
                    RawVisionPackageItem(
                        package_index=idx,
                        net_kg=roll_kg,
                        item_type=item_type,
                    )
                )
                idx += 1
    elif "column_1_packages" in gt:  # YS-0004
        for p in gt.get("column_1_packages", []):
            packages.append(
                RawVisionPackageItem(package_index=idx, net_kg=p["net_kg"], item_type="PACKAGE")
            )
            idx += 1
        for p in gt.get("column_2_packages", []):
            packages.append(
                RawVisionPackageItem(package_index=idx, net_kg=p["net_kg"], item_type="PACKAGE")
            )
            idx += 1
    elif "grid_structure" in gt:  # YS-0003, YS-0005, YS-0006
        grid = gt["grid_structure"]
        if "weight_rows" in grid:
            for r in grid["weight_rows"]:
                for val in r.get("values_kg", []):
                    packages.append(
                        RawVisionPackageItem(package_index=idx, net_kg=val, item_type="PACKAGE")
                    )
                    idx += 1
            for bo in grid.get("bo_rows", []):
                for val in bo.get("values_kg", []):
                    packages.append(
                        RawVisionPackageItem(package_index=idx, net_kg=val, item_type="ACCESSORY")
                    )
                    idx += 1
        elif "rows" in grid:  # YS-0005
            for r in grid["rows"]:
                for val in r.get("values_kg", []):
                    packages.append(
                        RawVisionPackageItem(package_index=idx, net_kg=val, item_type="PACKAGE")
                    )
                    idx += 1
        elif "rows_1_to_5_7_cols" in grid:  # YS-0003
            for r in grid["rows_1_to_5_7_cols"]:
                for val in r:
                    packages.append(
                        RawVisionPackageItem(package_index=idx, net_kg=val, item_type="PACKAGE")
                    )
                    idx += 1
            for r in grid.get("rows_6_to_15_6_cols", []):
                for val in r:
                    packages.append(
                        RawVisionPackageItem(package_index=idx, net_kg=val, item_type="PACKAGE")
                    )
                    idx += 1

    return RawVisionOutputSchema(
        document_type=doc_type,
        supplier_raw_name=supp_name,
        document_number=doc_number,
        document_date=doc_date,
        declared_net_weight_kg=declared_net,
        package_count=package_count,
        packages=packages,
    )


def test_manifest_integrity():
    """Validates manifest structure, sample count, and acceptance criteria."""
    manifest = load_manifest()
    assert manifest["dataset"] == "vinhphat-yarn-slip-v1"
    assert manifest["current_samples"] == len(manifest["samples"])
    assert manifest["current_samples"] >= 6


@pytest.mark.parametrize("sample_index", range(6))
def test_ground_truth_samples_math_consistency(sample_index: int):
    """
    Verifies that all 6 Ground Truth JSON files satisfy the 8-Level mathematical
    integrity rules without any unaccounted critical errors.
    """
    manifest = load_manifest()
    sample = manifest["samples"][sample_index]
    gt_path = DATASET_ROOT / sample["ground_truth_file"]

    assert gt_path.exists(), f"Ground truth file {gt_path} must exist"

    with open(gt_path, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    raw_schema = convert_ground_truth(sample["sample_id"], gt_data)
    discrepancies, has_critical = validate_mathematical_integrity(raw_schema)
    critical_errors = [d for d in discrepancies if d.severity == "ERROR"]

    # All human-verified ground truths must have 0 critical math errors
    assert (
        len(critical_errors) == 0
    ), f"Ground truth {sample['sample_id']} has critical math errors: {critical_errors}"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_live_gemini_extraction_benchmark():
    """
    Optional live integration test against Gemini API.
    Only runs if GEMINI_API_KEY is configured in environment.
    """
    if not settings.gemini_api_key:
        pytest.skip("GEMINI_API_KEY is not set. Skipping live vision integration test.")

    from vision.extraction.gemini import GeminiVisionProvider
    from vision.pipeline import DocumentIntelligencePipeline

    provider = GeminiVisionProvider()
    pipeline = DocumentIntelligencePipeline(provider=provider)

    test_img = DATASET_ROOT / "images" / "YS-0004.jpg"
    if not test_img.exists():
        pytest.skip("YS-0004.jpg not found")

    with open(test_img, "rb") as f:
        img_bytes = f.read()

    result = await pipeline.process(img_bytes)
    assert result.document.document_type is not None
    assert result.engine_telemetry is not None
    assert result.engine_telemetry.processing_duration_ms > 0
