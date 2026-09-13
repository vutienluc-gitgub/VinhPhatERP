"""
Field-Level & Document-Level Confidence Policy Evaluator
Transforms raw vision output into validated DTOs and enforces human review triggers.
"""

from typing import List
from vision.config import settings
from vision.constants import (
    LABEL_DECLARED_NET_WEIGHT,
    LABEL_DOCUMENT_DATE,
    LABEL_DOCUMENT_NUMBER,
    LABEL_SUPPLIER_NAME,
    TEMPLATE_CONFIDENCE_BELOW_THRESHOLD,
)
from vision.schemas import (
    DocumentHeaderDTO,
    ExtractionResultDTO,
    FieldValue,
    MathDiscrepancy,
    PackageItemDTO,
    RawVisionOutputSchema,
    SummaryDTO,
)


def build_extraction_dto(
    extracted_slip: RawVisionOutputSchema,
    discrepancies: List[MathDiscrepancy],
) -> ExtractionResultDTO:
    """
    Transforms raw vision output into an audited ExtractionResultDTO.
    Evaluates confidence thresholds and marks needs_manual_review flags.
    """
    review_reasons: List[str] = []
    field_conf = extracted_slip.field_confidences or {}

    def get_conf(field_name: str, default: float = 0.95) -> float:
        return field_conf.get(field_name, default)

    # 1. Document Header
    doc = DocumentHeaderDTO(
        document_type=extracted_slip.document_type,
        supplier_raw_name=FieldValue(
            value=extracted_slip.supplier_raw_name,
            confidence=get_conf("supplier_raw_name"),
            raw_text=extracted_slip.supplier_raw_name,
        ),
        document_number=FieldValue(
            value=extracted_slip.document_number,
            confidence=get_conf("document_number"),
            raw_text=extracted_slip.document_number,
        ),
        document_date=FieldValue(
            value=extracted_slip.document_date,
            confidence=get_conf("document_date"),
            raw_text=extracted_slip.document_date,
        ),
        vehicle_plate=FieldValue(
            value=extracted_slip.vehicle_plate,
            confidence=get_conf("vehicle_plate", 0.90),
            raw_text=extracted_slip.vehicle_plate,
        ),
        customer_name=FieldValue(
            value=extracted_slip.customer_name,
            confidence=get_conf("customer_name", 0.90),
            raw_text=extracted_slip.customer_name,
        ),
        notes=FieldValue(
            value=extracted_slip.notes,
            confidence=get_conf("notes", 0.85),
            raw_text=extracted_slip.notes,
        ),
    )

    # 2. Summary
    calc_net = (
        round(extracted_slip.gross_weight_kg - extracted_slip.tare_weight_kg, 2)
        if extracted_slip.gross_weight_kg is not None and extracted_slip.tare_weight_kg is not None
        else None
    )

    summary = SummaryDTO(
        yarn_type=FieldValue(
            value=extracted_slip.yarn_type,
            confidence=get_conf("yarn_type"),
            raw_text=extracted_slip.yarn_type,
        ),
        yarn_lot=FieldValue(
            value=extracted_slip.yarn_lot,
            confidence=get_conf("yarn_lot", 0.90),
            raw_text=extracted_slip.yarn_lot,
        ),
        package_count=FieldValue(
            value=extracted_slip.package_count,
            confidence=get_conf("package_count"),
        ),
        cone_count=FieldValue(
            value=extracted_slip.cone_count,
            confidence=get_conf("cone_count", 0.85),
        ),
        gross_weight_kg=FieldValue(
            value=extracted_slip.gross_weight_kg,
            confidence=get_conf("gross_weight_kg"),
        ),
        tare_weight_kg=FieldValue(
            value=extracted_slip.tare_weight_kg,
            confidence=get_conf("tare_weight_kg"),
        ),
        declared_net_weight_kg=FieldValue(
            value=extracted_slip.declared_net_weight_kg,
            confidence=get_conf("declared_net_weight_kg"),
        ),
        calculated_net_weight_kg=calc_net,
    )

    # 3. Packages
    packages: List[PackageItemDTO] = []
    for package_item in extracted_slip.packages:
        packages.append(
            PackageItemDTO(
                package_index=package_item.package_index,
                package_code=package_item.package_code,
                item_type=package_item.item_type,
                cone_count=package_item.cone_count,
                gross_kg=package_item.gross_kg,
                tare_kg=package_item.tare_kg,
                net_kg=package_item.net_kg,
                confidence=package_item.confidence,
                notes=package_item.notes,
            )
        )

    # 4. Confidence Threshold Policy Checks
    critical_checks = [
        (LABEL_SUPPLIER_NAME, doc.supplier_raw_name.confidence),
        (LABEL_DOCUMENT_NUMBER, doc.document_number.confidence),
        (LABEL_DOCUMENT_DATE, doc.document_date.confidence),
        (LABEL_DECLARED_NET_WEIGHT, summary.declared_net_weight_kg.confidence),
    ]

    for field_label, conf in critical_checks:
        if conf < settings.confidence_critical:
            review_reasons.append(
                TEMPLATE_CONFIDENCE_BELOW_THRESHOLD.format(
                    field_label=field_label,
                    confidence=conf,
                    threshold=settings.confidence_critical,
                )
            )

    # 5. Add Math Discrepancy Reasons
    for disc in discrepancies:
        if disc.severity == "ERROR":
            review_reasons.append(f"[{disc.level}] {disc.message_vi}")
        elif disc.severity == "WARNING":
            review_reasons.append(f"[Cảnh báo {disc.level}] {disc.message_vi}")

    needs_manual_review = len(review_reasons) > 0

    return ExtractionResultDTO(
        document=doc,
        summary=summary,
        packages=packages,
        math_discrepancies=discrepancies,
        needs_manual_review=needs_manual_review,
        review_reasons=review_reasons,
    )
