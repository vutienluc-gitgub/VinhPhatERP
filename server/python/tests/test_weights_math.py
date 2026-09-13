"""
Unit Tests for 8-Level Mathematical Integrity Verification Engine
Fast, zero-network tests validating mathematical rules against synthetic and real Ground Truth data.
"""

import json
from pathlib import Path
import pytest
from vision.schemas import RawVisionOutputSchema, RawVisionPackageItem
from vision.validation.weights import validate_mathematical_integrity


def test_perfect_math_consistency():
    """Validates that a completely consistent document passes with zero discrepancies."""
    data = RawVisionOutputSchema(
        gross_weight_kg=1052.5,
        tare_weight_kg=52.5,
        declared_net_weight_kg=1000.0,
        package_count=2,
        packages=[
            RawVisionPackageItem(package_index=1, net_kg=500.0),
            RawVisionPackageItem(package_index=2, net_kg=500.0),
        ],
    )
    discrepancies, has_error = validate_mathematical_integrity(data)
    assert len(discrepancies) == 0
    assert not has_error


def test_l1_net_mismatch():
    """Detects when Declared Net differs from (Gross - Tare) beyond tolerance."""
    data = RawVisionOutputSchema(
        gross_weight_kg=1000.0,
        tare_weight_kg=50.0,
        declared_net_weight_kg=940.0,  # Expected 950.0, diff = 10.0kg
        packages=[],
    )
    discrepancies, has_error = validate_mathematical_integrity(data)
    assert has_error
    l1_errors = [d for d in discrepancies if d.level == "L1"]
    assert len(l1_errors) == 1
    assert l1_errors[0].diff == 10.0
    assert l1_errors[0].severity == "ERROR"


def test_l2_sum_package_nets_mismatch():
    """Detects when sum of individual rolls does not match declared net."""
    data = RawVisionOutputSchema(
        declared_net_weight_kg=100.0,
        packages=[
            RawVisionPackageItem(package_index=1, net_kg=45.0),
            RawVisionPackageItem(package_index=2, net_kg=50.0),  # Sum = 95.0, diff = 5.0kg
        ],
    )
    discrepancies, has_error = validate_mathematical_integrity(data)
    assert has_error
    l2_errors = [d for d in discrepancies if d.level == "L2"]
    assert len(l2_errors) == 1
    assert l2_errors[0].diff == 5.0


def test_l5_package_count_mismatch():
    """Detects when package row count does not match summary count."""
    data = RawVisionOutputSchema(
        package_count=10,
        packages=[
            RawVisionPackageItem(package_index=i, net_kg=20.0)
            for i in range(1, 9)  # Only 8 packages
        ],
    )
    discrepancies, has_error = validate_mathematical_integrity(data)
    assert has_error
    l5_errors = [d for d in discrepancies if d.level == "L5"]
    assert len(l5_errors) == 1
    assert l5_errors[0].expected == 10.0
    assert l5_errors[0].actual == 8.0


def test_l6_duplicate_package_indices():
    """Detects duplicated row indices."""
    data = RawVisionOutputSchema(
        packages=[
            RawVisionPackageItem(package_index=1, net_kg=20.0),
            RawVisionPackageItem(package_index=1, net_kg=21.0),  # Duplicate index 1
        ],
    )
    discrepancies, _ = validate_mathematical_integrity(data)
    l6_warnings = [d for d in discrepancies if d.level == "L6"]
    assert len(l6_warnings) == 1


def test_l7_non_negative_bounds():
    """Flags negative or zero roll weights as fatal errors."""
    data = RawVisionOutputSchema(
        packages=[
            RawVisionPackageItem(package_index=1, net_kg=-2.5),
        ],
    )
    discrepancies, has_error = validate_mathematical_integrity(data)
    assert has_error
    l7_errors = [d for d in discrepancies if d.level == "L7"]
    assert len(l7_errors) >= 1


def test_outlier_weight_detection():
    """Detects when a package diverges by > 25% from batch median."""
    packages = [
        RawVisionPackageItem(package_index=i, net_kg=20.0)
        for i in range(1, 9)
    ]
    # Add an outlier package (32.0 kg vs 20.0 kg median -> +60%)
    packages.append(RawVisionPackageItem(package_index=9, net_kg=32.0))

    data = RawVisionOutputSchema(
        declared_net_weight_kg=192.0,
        packages=packages,
    )
    discrepancies, _ = validate_mathematical_integrity(data)
    outlier_warnings = [d for d in discrepancies if d.level == "OUTLIER"]
    assert len(outlier_warnings) == 1
    assert packages[8].is_outlier is True


def test_real_sample_ys0006_ground_truth_math():
    """Validates math against real Ground Truth YS-0006 (Hiệp Thủy mixed items)."""
    from tests.test_benchmark import convert_ground_truth
    workspace_root = Path(__file__).resolve().parents[3]
    gt_path = workspace_root / "datasets" / "yarn-slip" / "v1" / "ground-truth" / "YS-0006.json"
    if not gt_path.exists():
        pytest.skip(f"Dataset file {gt_path} not found")

    with open(gt_path, "r", encoding="utf-8") as f:
        gt = json.load(f)

    data = convert_ground_truth("YS-0006", gt)
    discrepancies, has_error = validate_mathematical_integrity(data)
    critical_errors = [d for d in discrepancies if d.severity == "ERROR"]
    assert len(critical_errors) == 0, f"Unexpected errors in YS-0006: {critical_errors}"
