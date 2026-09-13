"""
Centralized Constants and Localized Messages for VinhPhatERP Vision Engine
Standardizes all domain labels, error templates, and preprocessing hyperparameters.
"""

from typing import Tuple

# ==============================================================================
# OpenCV Preprocessing Hyperparameters
# ==============================================================================
DESKEW_MIN_ANGLE_DEG: float = 0.5
DESKEW_MAX_ANGLE_DEG: float = 30.0
DESKEW_MIN_FEATURE_POINTS: int = 50

CLAHE_CLIP_LIMIT: float = 2.0
CLAHE_TILE_GRID_SIZE: Tuple[int, int] = (8, 8)
JPEG_ENCODE_QUALITY: int = 95


# ==============================================================================
# Gate 0 Quality Gate Messages (Vietnamese)
# ==============================================================================
MSG_QUALITY_IMAGE_DECODE_FAILED: str = (
    "Không thể giải mã tệp tin hình ảnh (Định dạng hỏng hoặc không hỗ trợ)."
)
MSG_QUALITY_GATE_USER_GUIDANCE: str = (
    "Vui lòng chụp lại ảnh với đủ ánh sáng, giữ chắc tay để không bị nhòe nét cân."
)

TEMPLATE_QUALITY_RESOLUTION_TOO_LOW: str = (
    "Độ phân giải ảnh quá thấp ({width}x{height}px < chuẩn tối thiểu {min_res}px)."
)
TEMPLATE_QUALITY_BLUR_DETECTED: str = (
    "Ảnh bị mờ nét (Điểm nét blur score: {blur:.1f} < ngưỡng {threshold:.1f})."
)
TEMPLATE_QUALITY_TOO_DARK: str = (
    "Ảnh quá tối, thiếu sáng (Độ sáng: {brightness:.1f} < {min_brightness:.1f})."
)
TEMPLATE_QUALITY_TOO_BRIGHT: str = (
    "Ảnh bị cháy sáng hoặc lóa đèn (Độ sáng: {brightness:.1f} > {max_brightness:.1f})."
)


# ==============================================================================
# 8-Level Mathematical Verification Messages (Vietnamese)
# ==============================================================================
RULE_L1_NAME: str = "Summary Net Consistency"
RULE_L2_NAME: str = "Sum of Package Nets"
RULE_L3_NAME: str = "Sum of Package Gross"
RULE_L4_NAME: str = "Sum of Package Tares"
RULE_L5_NAME: str = "Package Count Match"
RULE_L6_NAME: str = "Unique Package Index"
RULE_L7_NAME: str = "Non-negative Bounds"
RULE_L8_NAME: str = "Cone Count Integrity"
RULE_OUTLIER_NAME: str = "Package Weight Outlier"

TEMPLATE_MATH_L1_MSG: str = (
    "Khối lượng tịnh khai báo ({declared_net} kg) không khớp Gross - Tare "
    "({gross} - {tare} = {calc_net:.2f} kg, lệch {diff:.2f} kg)."
)
TEMPLATE_MATH_L2_MSG: str = (
    "Tổng cân tịnh các cây/kiện ({sum_nets:.2f} kg) không khớp tổng tịnh trên phiếu "
    "({declared_net} kg, lệch {diff:.2f} kg)."
)
TEMPLATE_MATH_L3_MSG: str = (
    "Tổng cân gộp các kiện ({sum_gross:.2f} kg) lệch so với Gross tổng "
    "({gross} kg, lệch {diff:.2f} kg)."
)
TEMPLATE_MATH_L4_MSG: str = (
    "Tổng cân bì các kiện ({sum_tare:.2f} kg) lệch so với Tare tổng ({tare} kg)."
)
TEMPLATE_MATH_L5_MSG: str = (
    "Số lượng cây/kiện bóc tách ({total_items} mục) không khớp số lượng ghi trên phiếu ({declared_count})."
)
MSG_MATH_L6_DUPLICATE_INDEX: str = (
    "Phát hiện số thứ tự kiện bị trùng lặp trong danh sách."
)
MSG_MATH_L7_NET_STRICT_POSITIVE: str = (
    "Khối lượng tịnh phải lớn hơn 0."
)
TEMPLATE_MATH_L7_INVALID_PACKAGE_WEIGHT: str = (
    "Kiện STT {package_index} có khối lượng tịnh không hợp lệ ({net_kg} kg <= 0)."
)
TEMPLATE_MATH_L8_CONE_COUNT_MISMATCH: str = (
    "Tổng số búp sợi chi tiết ({sum_cones}) không khớp số búp trên phiếu ({declared_cones})."
)
TEMPLATE_MATH_OUTLIER_MSG: str = (
    "Kiện STT {package_index} có khối lượng bất thường "
    "({net_kg} kg so với trung vị nhóm {median:.1f} kg, lệch {ratio:.0f}%)."
)


# ==============================================================================
# Confidence Policy Domain Labels & Messages
# ==============================================================================
LABEL_SUPPLIER_NAME: str = "Nhà cung cấp"
LABEL_DOCUMENT_NUMBER: str = "Số phiếu"
LABEL_DOCUMENT_DATE: str = "Ngày chứng từ"
LABEL_DECLARED_NET_WEIGHT: str = "Khối lượng tịnh"

TEMPLATE_CONFIDENCE_BELOW_THRESHOLD: str = (
    "Độ tin cậy nhận diện trường '{field_label}' thấp ({confidence:.2f} < {threshold:.2f})."
)


# ==============================================================================
# Provider Messages
# ==============================================================================
MSG_GEMINI_API_KEY_NOT_CONFIGURED: str = (
    "GEMINI_API_KEY chưa được cấu hình. Vui lòng thiết lập biến môi trường GEMINI_API_KEY."
)
