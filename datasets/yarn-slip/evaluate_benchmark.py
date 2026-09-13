"""Benchmark Evaluator for VinhPhatERP FEAT-YARN-OCR Phase 0

Compares AI extraction outputs against Human-Verified Ground Truth.
Computes:
- Field-level accuracy for critical, important, and informational fields.
- Document-level zero-defect accuracy.
- False Auto-Approval Rate (FAAR) - MUST BE 0.0%.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List


@dataclass
class MetricSummary:
    total_samples: int = 0
    fully_correct_docs: int = 0
    false_auto_approvals: int = 0  # CRITICAL: Must be 0
    field_matches: Dict[str, int] = None
    field_totals: Dict[str, int] = None

    def __post_init__(self):
        if self.field_matches is None:
            self.field_matches = {}
        if self.field_totals is None:
            self.field_totals = {}


CRITICAL_FIELDS = [
    "supplier",
    "document_number",
    "document_date",
    "gross_weight",
    "tare_weight",
    "net_weight",
]

WEIGHT_TOLERANCE_KG = 0.05  # Configurable scale tolerance


def normalize_str(val: Any) -> str:
    if val is None:
        return ""
    return " ".join(str(val).strip().lower().split())


def compare_weight(actual: float | None, expected: float | None) -> bool:
    if actual is None and expected is None:
        return True
    if actual is None or expected is None:
        return False
    return abs(float(actual) - float(expected)) <= WEIGHT_TOLERANCE_KG


def evaluate_sample(
    prediction: Dict[str, Any], ground_truth: Dict[str, Any]
) -> tuple[bool, Dict[str, bool], bool]:
    """Evaluate a single sample.

    Returns:
        (is_doc_correct, field_results, is_false_auto_approval)
    """
    gt_data = ground_truth.get("ground_truth", {})
    pred_doc = prediction.get("document", {})
    pred_summary = prediction.get("summary", {})
    pred_quality = prediction.get("quality", {})

    field_results: Dict[str, bool] = {}

    # 1. Supplier comparison (fuzzy/normalized match)
    gt_supplier = gt_data.get("supplier", {})
    gt_sup_names = [
        normalize_str(gt_supplier.get("raw_text")),
        normalize_str(gt_supplier.get("canonical_name")),
        normalize_str(gt_supplier.get("short_name")),
    ]
    pred_sup = normalize_str(pred_doc.get("supplier_raw_name"))
    field_results["supplier"] = any(
        (name and (name in pred_sup or pred_sup in name)) for name in gt_sup_names
    )

    # 2. Document Number
    gt_doc_num = normalize_str(gt_data.get("document_number"))
    pred_doc_num = normalize_str(pred_doc.get("document_number"))
    field_results["document_number"] = gt_doc_num == pred_doc_num

    # 3. Document Date
    gt_date = normalize_str(gt_data.get("document_date"))
    pred_date = normalize_str(pred_doc.get("document_date"))
    field_results["document_date"] = gt_date == pred_date

    # 4. Weights
    gt_summary = gt_data.get("summary", {})
    field_results["gross_weight"] = compare_weight(
        pred_summary.get("gross_kg"), gt_summary.get("gross_weight_kg")
    )
    field_results["tare_weight"] = compare_weight(
        pred_summary.get("tare_kg"), gt_summary.get("tare_weight_kg")
    )
    field_results["net_weight"] = compare_weight(
        pred_summary.get("declared_net_kg") or pred_summary.get("calculated_net_kg"),
        gt_summary.get("declared_net_weight_kg"),
    )

    # Document-level zero defect
    is_doc_correct = all(field_results.get(f, False) for f in CRITICAL_FIELDS)

    # FAAR: If any critical field failed, BUT needs_manual_review was False -> FATAL
    needs_manual_review = pred_quality.get("needs_manual_review", True)
    is_false_auto_approval = (not is_doc_correct) and (not needs_manual_review)

    return is_doc_correct, field_results, is_false_auto_approval


def run_benchmark(
    ground_truth_dir: Path, predictions_dir: Path
) -> MetricSummary:
    summary = MetricSummary()
    gt_files = sorted(list(ground_truth_dir.glob("*.json")))

    for gt_path in gt_files:
        if gt_path.name == "sample-template.json":
            continue

        pred_path = predictions_dir / gt_path.name
        if not pred_path.exists():
            print(f"[WARN] Prediction missing for {gt_path.name}")
            continue

        with open(gt_path, "r", encoding="utf-8") as f:
            gt_data = json.load(f)
        with open(pred_path, "r", encoding="utf-8") as f:
            pred_data = json.load(f)

        is_doc_correct, field_results, is_false_auto = evaluate_sample(
            pred_data, gt_data
        )

        summary.total_samples += 1
        if is_doc_correct:
            summary.fully_correct_docs += 1
        if is_false_auto:
            summary.false_auto_approvals += 1

        for field, matched in field_results.items():
            summary.field_totals[field] = summary.field_totals.get(field, 0) + 1
            if matched:
                summary.field_matches[field] = (
                    summary.field_matches.get(field, 0) + 1
                )

    return summary


def print_report(summary: MetricSummary) -> bool:
    print("\n" + "=" * 60)
    print("      FEAT-YARN-OCR PHASE 0 BENCHMARK REPORT")
    print("=" * 60)
    print(f"Total Evaluated Samples: {summary.total_samples}")

    doc_acc = (
        (summary.fully_correct_docs / summary.total_samples * 100)
        if summary.total_samples
        else 0.0
    )
    print(
        f"Document-Level Accuracy: {doc_acc:.2f}% (Target: >= 95.0%) -> {'PASS' if doc_acc >= 95.0 else 'FAIL'}"
    )

    faar = (
        (summary.false_auto_approvals / summary.total_samples * 100)
        if summary.total_samples
        else 0.0
    )
    faar_pass = summary.false_auto_approvals == 0
    print(
        f"False Auto-Approval Rate (FAAR): {faar:.2f}% (Target: 0.0%) -> {'PASS' if faar_pass else 'FAIL (CRITICAL VIOLATION)'}"
    )

    print("\nField-Level Accuracies:")
    field_all_passed = True
    for field in CRITICAL_FIELDS:
        total = summary.field_totals.get(field, 0)
        matches = summary.field_matches.get(field, 0)
        acc = (matches / total * 100) if total else 0.0
        target = 99.0 if field == "net_weight" else 98.0
        passed = acc >= target
        if not passed:
            field_all_passed = False
        status = "PASS" if passed else "FAIL"
        print(
            f"  - {field:16s}: {acc:5.1f}% ({matches}/{total}) [Target: >={target}%] -> {status}"
        )

    print("=" * 60)
    overall_pass = doc_acc >= 95.0 and faar_pass and field_all_passed
    print(
        f"OVERALL BENCHMARK VERDICT: {'ACCEPTED FOR PHASE 1' if overall_pass else 'REJECTED - NEEDS PROMPT/FILTER TUNING'}"
    )
    print("=" * 60 + "\n")
    return overall_pass


if __name__ == "__main__":
    gt_dir = Path("datasets/yarn-slip/v1/ground-truth")
    preds_dir = Path("datasets/yarn-slip/v1/predictions")
    if gt_dir.exists() and preds_dir.exists():
        summary = run_benchmark(gt_dir, preds_dir)
        print_report(summary)
    else:
        print(
            "Benchmark runner ready. Populate ground-truth and predictions directories to evaluate."
        )
