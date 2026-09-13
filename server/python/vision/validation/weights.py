"""
8-Level Mathematical Integrity Verification Engine
Validates consistency across Gross, Tare, Net, package sums, row counts, and outliers.
Returns structured MathDiscrepancy objects for logging, UI alerts, and Self-Healing prompts.
"""

from typing import List, Tuple
import numpy as np
from vision.config import settings
from vision.constants import (
    MSG_MATH_L6_DUPLICATE_INDEX,
    MSG_MATH_L7_NET_STRICT_POSITIVE,
    RULE_L1_NAME,
    RULE_L2_NAME,
    RULE_L3_NAME,
    RULE_L4_NAME,
    RULE_L5_NAME,
    RULE_L6_NAME,
    RULE_L7_NAME,
    RULE_L8_NAME,
    RULE_OUTLIER_NAME,
    TEMPLATE_MATH_L1_MSG,
    TEMPLATE_MATH_L2_MSG,
    TEMPLATE_MATH_L3_MSG,
    TEMPLATE_MATH_L4_MSG,
    TEMPLATE_MATH_L5_MSG,
    TEMPLATE_MATH_L7_INVALID_PACKAGE_WEIGHT,
    TEMPLATE_MATH_L8_CONE_COUNT_MISMATCH,
    TEMPLATE_MATH_OUTLIER_MSG,
)
from vision.schemas import MathDiscrepancy, RawVisionOutputSchema


def validate_mathematical_integrity(
    slip_data: RawVisionOutputSchema,
    tolerance_kg: float = settings.document_tolerance_kg,
) -> Tuple[List[MathDiscrepancy], bool]:
    """
    Executes 8-Level mathematical verification against extracted document data.
    Returns: (list_of_discrepancies, has_critical_error)
    """
    discrepancies: List[MathDiscrepancy] = []

    gross = slip_data.gross_weight_kg
    tare = slip_data.tare_weight_kg
    declared_net = slip_data.declared_net_weight_kg
    packages = slip_data.packages

    # --------------------------------------------------------------------------
    # Level 1: Summary Net Consistency (|Gross - Tare - DeclaredNet| <= tolerance)
    # --------------------------------------------------------------------------
    if gross is not None and tare is not None and declared_net is not None:
        calc_net = gross - tare
        diff = abs(calc_net - declared_net)
        if diff > tolerance_kg:
            discrepancies.append(
                MathDiscrepancy(
                    level="L1",
                    rule_name=RULE_L1_NAME,
                    severity="ERROR",
                    expected=round(calc_net, 2),
                    actual=round(declared_net, 2),
                    diff=round(diff, 2),
                    tolerance=tolerance_kg,
                    message_vi=TEMPLATE_MATH_L1_MSG.format(
                        declared_net=declared_net,
                        gross=gross,
                        tare=tare,
                        calc_net=calc_net,
                        diff=diff,
                    ),
                    debug_prompt=f"L1_DISCREPANCY: Declared Net ({declared_net} kg) does not equal Gross ({gross}) minus Tare ({tare}) = {calc_net:.2f} kg. Re-verify Gross, Tare and Net weights.",
                )
            )

    # --------------------------------------------------------------------------
    # Level 2: Sum of Package Nets (|Sum(pkg.net) - DeclaredNet| <= tolerance)
    # --------------------------------------------------------------------------
    if packages and declared_net is not None:
        sum_nets = sum(p.net_kg for p in packages)
        diff = abs(sum_nets - declared_net)
        if diff > tolerance_kg:
            discrepancies.append(
                MathDiscrepancy(
                    level="L2",
                    rule_name=RULE_L2_NAME,
                    severity="ERROR",
                    expected=round(declared_net, 2),
                    actual=round(sum_nets, 2),
                    diff=round(diff, 2),
                    tolerance=tolerance_kg,
                    message_vi=TEMPLATE_MATH_L2_MSG.format(
                        sum_nets=sum_nets,
                        declared_net=declared_net,
                        diff=diff,
                    ),
                    debug_prompt=f"L2_DISCREPANCY: Sum of package nets ({sum_nets:.2f} kg) mismatches Declared Net ({declared_net} kg) by {diff:.2f} kg. Check if any tally rows were missed or misread.",
                )
            )

    # --------------------------------------------------------------------------
    # Level 3: Sum of Package Gross
    # --------------------------------------------------------------------------
    pkg_gross_list = [p.gross_kg for p in packages if p.gross_kg is not None]
    if len(pkg_gross_list) == len(packages) and gross is not None and packages:
        sum_gross = sum(pkg_gross_list)
        diff = abs(sum_gross - gross)
        if diff > tolerance_kg:
            discrepancies.append(
                MathDiscrepancy(
                    level="L3",
                    rule_name=RULE_L3_NAME,
                    severity="WARNING",
                    expected=round(gross, 2),
                    actual=round(sum_gross, 2),
                    diff=round(diff, 2),
                    tolerance=tolerance_kg,
                    message_vi=TEMPLATE_MATH_L3_MSG.format(
                        sum_gross=sum_gross,
                        gross=gross,
                        diff=diff,
                    ),
                    debug_prompt=f"L3_DISCREPANCY: Sum of package gross weights ({sum_gross:.2f} kg) does not match document gross ({gross} kg).",
                )
            )

    # --------------------------------------------------------------------------
    # Level 4: Sum of Package Tares
    # --------------------------------------------------------------------------
    pkg_tare_list = [p.tare_kg for p in packages if p.tare_kg is not None]
    if len(pkg_tare_list) == len(packages) and tare is not None and packages:
        sum_tare = sum(pkg_tare_list)
        diff = abs(sum_tare - tare)
        if diff > tolerance_kg:
            discrepancies.append(
                MathDiscrepancy(
                    level="L4",
                    rule_name=RULE_L4_NAME,
                    severity="WARNING",
                    expected=round(tare, 2),
                    actual=round(sum_tare, 2),
                    diff=round(diff, 2),
                    tolerance=tolerance_kg,
                    message_vi=TEMPLATE_MATH_L4_MSG.format(
                        sum_tare=sum_tare,
                        tare=tare,
                    ),
                    debug_prompt=f"L4_DISCREPANCY: Sum of package tares ({sum_tare:.2f} kg) does not match document tare ({tare} kg).",
                )
            )

    # --------------------------------------------------------------------------
    # Level 5: Package Count Match
    # --------------------------------------------------------------------------
    if slip_data.package_count is not None and packages:
        # In documents with mixed items (packages + accessories), count packages
        regular_packages_count = sum(1 for p in packages if p.item_type == "PACKAGE")
        total_items_count = len(packages)

        # Match either exact regular packages count or total items count
        if regular_packages_count != slip_data.package_count and total_items_count != slip_data.package_count:
            diff = abs(total_items_count - slip_data.package_count)
            discrepancies.append(
                MathDiscrepancy(
                    level="L5",
                    rule_name=RULE_L5_NAME,
                    severity="ERROR",
                    expected=float(slip_data.package_count),
                    actual=float(total_items_count),
                    diff=float(diff),
                    tolerance=0.0,
                    message_vi=TEMPLATE_MATH_L5_MSG.format(
                        total_items=total_items_count,
                        declared_count=slip_data.package_count,
                    ),
                    debug_prompt=f"L5_DISCREPANCY: Extracted package count ({total_items_count}) does not match declared package_count ({slip_data.package_count}). Check for missed rolls or columns.",
                )
            )

    # --------------------------------------------------------------------------
    # Level 6: Unique Package Index
    # --------------------------------------------------------------------------
    if packages:
        indices = [p.package_index for p in packages]
        if len(indices) != len(set(indices)):
            discrepancies.append(
                MathDiscrepancy(
                    level="L6",
                    rule_name=RULE_L6_NAME,
                    severity="WARNING",
                    expected=float(len(indices)),
                    actual=float(len(set(indices))),
                    diff=float(len(indices) - len(set(indices))),
                    tolerance=0.0,
                    message_vi=MSG_MATH_L6_DUPLICATE_INDEX,
                    debug_prompt="L6_DISCREPANCY: Duplicate package indices detected. Ensure all extracted packages have unique sequential indices.",
                )
            )

    # --------------------------------------------------------------------------
    # Level 7: Non-negative Bounds & Ordering
    # --------------------------------------------------------------------------
    if declared_net is not None and declared_net <= 0:
        discrepancies.append(
            MathDiscrepancy(
                level="L7",
                rule_name=RULE_L7_NAME,
                severity="ERROR",
                expected=0.0,
                actual=declared_net,
                diff=declared_net,
                tolerance=0.0,
                message_vi=MSG_MATH_L7_NET_STRICT_POSITIVE,
                debug_prompt="L7_DISCREPANCY: Declared net weight must be strictly positive.",
            )
        )

    for p in packages:
        if p.net_kg <= 0:
            discrepancies.append(
                MathDiscrepancy(
                    level="L7",
                    rule_name=RULE_L7_NAME,
                    severity="ERROR",
                    expected=0.0,
                    actual=p.net_kg,
                    diff=p.net_kg,
                    tolerance=0.0,
                    message_vi=TEMPLATE_MATH_L7_INVALID_PACKAGE_WEIGHT.format(
                        package_index=p.package_index,
                        net_kg=p.net_kg,
                    ),
                    debug_prompt=f"L7_DISCREPANCY: Package {p.package_index} has non-positive weight {p.net_kg} kg.",
                )
            )

    # --------------------------------------------------------------------------
    # Level 8: Cone Count Integrity
    # --------------------------------------------------------------------------
    if slip_data.cone_count is not None and packages:
        pkg_cones = [p.cone_count for p in packages if p.cone_count is not None]
        if len(pkg_cones) == len(packages):
            sum_cones = sum(pkg_cones)
            if sum_cones != slip_data.cone_count:
                discrepancies.append(
                    MathDiscrepancy(
                        level="L8",
                        rule_name=RULE_L8_NAME,
                        severity="WARNING",
                        expected=float(slip_data.cone_count),
                        actual=float(sum_cones),
                        diff=float(abs(sum_cones - slip_data.cone_count)),
                        tolerance=0.0,
                        message_vi=TEMPLATE_MATH_L8_CONE_COUNT_MISMATCH.format(
                            sum_cones=sum_cones,
                            declared_cones=slip_data.cone_count,
                        ),
                        debug_prompt=f"L8_DISCREPANCY: Sum of cones ({sum_cones}) != declared cones ({slip_data.cone_count}).",
                    )
                )

    # --------------------------------------------------------------------------
    # Outlier Weight Detection (Flag outlier rolls diverging > 25% from batch median)
    # --------------------------------------------------------------------------
    package_weights = [p.net_kg for p in packages if p.item_type == "PACKAGE" and p.net_kg > 0]
    if len(package_weights) >= 5:
        median_weight = float(np.median(package_weights))
        for p in packages:
            if p.item_type == "PACKAGE":
                ratio = abs(p.net_kg - median_weight) / median_weight
                if ratio > 0.25:
                    p.is_outlier = True
                    discrepancies.append(
                        MathDiscrepancy(
                            level="OUTLIER",
                            rule_name=RULE_OUTLIER_NAME,
                            severity="WARNING",
                            expected=round(median_weight, 2),
                            actual=round(p.net_kg, 2),
                            diff=round(abs(p.net_kg - median_weight), 2),
                            tolerance=round(median_weight * 0.25, 2),
                            message_vi=TEMPLATE_MATH_OUTLIER_MSG.format(
                                package_index=p.package_index,
                                net_kg=p.net_kg,
                                median=median_weight,
                                ratio=ratio * 100,
                            ),
                            debug_prompt=f"OUTLIER_CHECK: Package index {p.package_index} has unusual weight {p.net_kg}kg vs batch median {median_weight:.1f}kg. Verify if handwritten digits were misread.",
                        )
                    )

    has_critical_error = any(d.severity == "ERROR" for d in discrepancies)
    return discrepancies, has_critical_error
