"""
Pydantic Schemas and DTOs for VinhPhatERP Vision Pipeline
Defines rigorous data contracts, provenance, confidence, and JSON Mode schemas.
"""

from typing import Dict, Generic, List, Literal, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class FieldValue(BaseModel, Generic[T]):
    """Wraps an extracted value with visual confidence and origin provenance."""
    value: Optional[T] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    raw_text: Optional[str] = None
    provenance: Optional[str] = None


class DocumentHeaderDTO(BaseModel):
    document_type: str = "YARN_WEIGHING_SLIP"
    supplier_raw_name: FieldValue[str] = Field(default_factory=FieldValue)
    document_number: FieldValue[str] = Field(default_factory=FieldValue)
    document_date: FieldValue[str] = Field(default_factory=FieldValue)
    vehicle_plate: FieldValue[str] = Field(default_factory=FieldValue)
    customer_name: FieldValue[str] = Field(default_factory=FieldValue)
    notes: FieldValue[str] = Field(default_factory=FieldValue)


class SummaryDTO(BaseModel):
    yarn_type: FieldValue[str] = Field(default_factory=FieldValue)
    yarn_lot: FieldValue[str] = Field(default_factory=FieldValue)
    package_count: FieldValue[int] = Field(default_factory=FieldValue)
    cone_count: FieldValue[int] = Field(default_factory=FieldValue)
    gross_weight_kg: FieldValue[float] = Field(default_factory=FieldValue)
    tare_weight_kg: FieldValue[float] = Field(default_factory=FieldValue)
    declared_net_weight_kg: FieldValue[float] = Field(default_factory=FieldValue)
    calculated_net_weight_kg: Optional[float] = None


class PackageItemDTO(BaseModel):
    package_index: int
    package_code: Optional[str] = None
    item_type: str = "PACKAGE"  # "PACKAGE", "ACCESSORY" (Bo), "GIFT" (biếu)
    cone_count: Optional[int] = None
    gross_kg: Optional[float] = None
    tare_kg: Optional[float] = None
    net_kg: float
    confidence: float = 1.0
    is_outlier: bool = False
    notes: Optional[str] = None


class MathDiscrepancy(BaseModel):
    """Specific mathematical violation identified by the 8-Level Verification Engine."""
    level: str  # e.g., "L1", "L2", ..., "L8"
    rule_name: str
    severity: Literal["ERROR", "WARNING"]
    expected: float
    actual: float
    diff: float
    tolerance: float
    message_vi: str
    debug_prompt: str


class QualityMetricsDTO(BaseModel):
    blur_score: float
    brightness_mean: float
    deskew_angle_degrees: float = 0.0
    passed_gate_0: bool = True
    warnings: List[str] = Field(default_factory=list)


class EngineTelemetryDTO(BaseModel):
    engine: str = "gemini-2.5-flash"
    model_version: Optional[str] = None
    processing_duration_ms: int = 0
    correction_attempts: int = 0
    quality_metrics: Optional[QualityMetricsDTO] = None


class ExtractionResultDTO(BaseModel):
    document: DocumentHeaderDTO
    summary: SummaryDTO
    packages: List[PackageItemDTO] = Field(default_factory=list)
    math_discrepancies: List[MathDiscrepancy] = Field(default_factory=list)
    needs_manual_review: bool = False
    review_reasons: List[str] = Field(default_factory=list)
    engine_telemetry: Optional[EngineTelemetryDTO] = None


# ==============================================================================
# Raw Vision Schema for Gemini Structured Output (response_schema)
# ==============================================================================

class RawVisionPackageItem(BaseModel):
    package_index: int
    package_code: Optional[str] = None
    item_type: str = Field(
        default="PACKAGE",
        description="PACKAGE (cây/kiện), ACCESSORY (Bo phụ kiện), GIFT (cây biếu)"
    )
    cone_count: Optional[int] = None
    gross_kg: Optional[float] = None
    tare_kg: Optional[float] = None
    net_kg: float
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    is_outlier: bool = False
    notes: Optional[str] = None


class RawVisionOutputSchema(BaseModel):
    """Deterministic JSON schema enforced directly in Gemini API call."""
    document_type: str = "YARN_WEIGHING_SLIP"
    supplier_raw_name: Optional[str] = None
    document_number: Optional[str] = None
    document_date: Optional[str] = None
    vehicle_plate: Optional[str] = None
    customer_name: Optional[str] = None
    notes: Optional[str] = None

    yarn_type: Optional[str] = None
    yarn_lot: Optional[str] = None
    package_count: Optional[int] = None
    cone_count: Optional[int] = None
    gross_weight_kg: Optional[float] = None
    tare_weight_kg: Optional[float] = None
    declared_net_weight_kg: Optional[float] = None

    packages: List[RawVisionPackageItem] = Field(default_factory=list)
    field_confidences: Dict[str, float] = Field(default_factory=dict)
