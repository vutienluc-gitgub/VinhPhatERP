/**
 * Constants and UI copy for Yarn Slip Scan Workspace (Phase 4)
 * Centralizes all user-facing strings, accessibility labels, and audit status messages.
 */

export const SCAN_WORKSPACE_LABELS = {
  MODAL_TITLE: 'Bóc Tách Phiếu Cân Sợi (AI Vision)',
  STEP_UPLOAD: 'Tải ảnh phiếu cân',
  STEP_PROCESSING: 'Đang xử lý & kiểm định',
  STEP_AUDIT: 'Đối chiếu & Xác nhận',

  // Upload Screen
  UPLOAD_HEADING: 'Tải lên hoặc Chụp ảnh phiếu cân sợi',
  UPLOAD_SUBHEADING:
    'Hệ thống AI tự động đọc phiếu in kim, phiếu in nhiệt, chữ viết tay và đối chiếu sai số toán học.',
  DROPZONE_PROMPT: 'Kéo thả ảnh phiếu cân vào đây hoặc bấm để chọn',
  DROPZONE_HINT: 'Hỗ trợ JPG, PNG, WebP (Tối đa 15MB)',
  BTN_CHOOSE_FILE: 'Chọn tệp ảnh từ máy',
  BTN_TAKE_PHOTO: 'Chụp ảnh từ Camera',
  CAMERA_CAPTURE_LABEL: 'Chụp ảnh trực tiếp bằng Camera di động',
  TIPS_TITLE: 'Lưu ý để đạt độ chính xác cao nhất:',
  TIP_LIGHTING:
    'Chụp vuông góc, đủ ánh sáng, hạn chế bóng đổ che khuất con số.',
  TIP_FOCUS: 'Giữ chắc tay để chữ in kim và số cân tịnh không bị nhòe nét.',
  TIP_FULL_FRAME:
    'Chụp toàn bộ phiếu cân, không cắt xén các dòng tổng và chữ ký.',

  // Prompt banner in StepGeneralInfo
  BANNER_PROMPT_TITLE: 'Bạn có ảnh phiếu cân sợi của đối tác?',
  BANNER_PROMPT_DESC:
    'Hệ thống AI tự động đọc phiếu in kim, viết tay và tính toán đối chiếu.',
  BTN_SCAN_AI: 'Quét phiếu AI',
  BTN_SCAN_ACTION: 'Quét phiếu cân (AI)',
  MSG_PREFILL_SUCCESS: 'Đã nạp dữ liệu từ phiếu cân!',

  // Progress Screen
  PROCESSING_HEADING: 'Đang bóc tách chứng từ bằng AI...',
  STAGE_UPLOAD: 'Đang truyền dữ liệu hình ảnh...',
  STAGE_GATE_0:
    'Kiểm tra chất lượng ảnh (Độ mờ, góc nghiêng, cân bằng sáng)...',
  STAGE_EXTRACTION: 'Trích xuất thực thể phiếu cân sợi (Gemini 2.5)...',
  STAGE_AUDIT: 'Kiểm toán số học 8 tầng & đối chiếu danh mục nhà cung cấp...',

  // Audit Screen Tabs & Sections
  TAB_DOCUMENT_IMAGE: 'Ảnh phiếu cân',
  TAB_AUDITED_DATA: 'Dữ liệu đối chiếu',

  IMAGE_CONTROLS_ZOOM_IN: 'Phóng to',
  IMAGE_CONTROLS_ZOOM_OUT: 'Thu nhỏ',
  IMAGE_CONTROLS_RESET: 'Đặt lại',

  SECTION_HEADER_INFO: 'Thông tin chứng từ',
  SECTION_WEIGHT_SUMMARY: 'Khối lượng & Quy cách sợi',
  SECTION_PACKAGES_TABLE: 'Chi tiết từng kiện cân',
  SECTION_DISCREPANCIES: 'Cảnh báo sai lệch số học',

  // Fields
  FIELD_DOC_NUMBER: 'Số phiếu cân',
  FIELD_DOC_DATE: 'Ngày cân',
  FIELD_SUPPLIER: 'Nhà cung cấp',
  FIELD_VEHICLE: 'Biển số xe / Tài xế',
  FIELD_CUSTOMER: 'Khách hàng / Đơn vị nhận',
  FIELD_NOTES: 'Ghi chú phiếu',
  FIELD_YARN_TYPE: 'Loại sợi',
  FIELD_LOT: 'Số lô (Lot)',
  FIELD_PACKAGE_COUNT: 'Tổng số kiện',
  FIELD_CONE_COUNT: 'Tổng số côn',
  FIELD_GROSS_WEIGHT: 'Cân gộp (Gross)',
  FIELD_TARE_WEIGHT: 'Cân bì (Tare)',
  FIELD_NET_WEIGHT: 'Cân tịnh (Net)',
  FIELD_CALCULATED_NET: 'Tịnh tính toán (Gross - Tare)',

  // Package Table Columns
  COL_INDEX: 'STT',
  COL_PACKAGE_CODE: 'Mã kiện',
  COL_CONES: 'Số côn',
  COL_GROSS: 'G.W (kg)',
  COL_TARE: 'Tare (kg)',
  COL_NET: 'N.W (kg)',
  COL_CONFIDENCE: 'Độ tin cậy',

  // Status Badges
  STATUS_PASSED: 'Toán học khớp 100%, sẵn sàng nhập kho',
  STATUS_WARNING: 'Cần thủ kho đối chiếu dữ liệu',
  STATUS_ERROR: 'Phát hiện sai số cân hoặc trùng lặp phiếu',
  STATUS_DUPLICATE_WARNING: 'Cảnh báo trùng lặp chứng từ',
  STATUS_AMBIGUOUS_SUPPLIER: 'Chưa khớp tuyệt đối nhà cung cấp',

  // Error Messages
  ERR_UNSUPPORTED_MIME:
    'Định dạng tệp không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WebP.',
  ERR_MAX_SIZE_EXCEEDED:
    'Kích thước tệp vượt quá 15MB. Vui lòng chọn ảnh có dung lượng nhỏ hơn.',
  ERR_UNKNOWN_SCAN: 'Đã xảy ra lỗi không xác định khi bóc tách phiếu cân.',

  // Actions
  BTN_RESCAN: 'Chụp / Tải ảnh khác',
  BTN_APPLY_DRAFT: 'Áp dụng vào phiếu nhập',
  BTN_CONFIRM_DIRECT: 'Xác nhận nhập kho & Ghi tồn',
  BTN_SAVE_DRAFT_DIRECT: 'Lưu phiếu nháp',
  BTN_EDIT_IN_FORM: 'Chỉnh sửa trên form',
  BTN_CANCEL: 'Hủy bỏ',
  CONFIRM_APPLY_WITH_ERRORS:
    'Phiếu cân đang có cảnh báo sai lệch số học. Bạn có chắc chắn muốn tiếp tục và chỉnh sửa thủ công trên form?',
  CONFIRM_DIRECT_PROMPT:
    'Xác nhận nhập kho trực tiếp và ghi tăng tồn kho cho phiếu cân này?',

  // Phase 5 Domain Transaction & Catalog
  FIELD_CATALOG_MATCH: 'Danh mục sợi khớp',
  STATUS_CATALOG_UNMATCHED: 'Chưa tự động khớp danh mục sợi',
  SWITCH_BREAKDOWN_PACKAGES: 'Lập chi tiết từng kiện (theo bảng kiện)',
  MSG_CONFIRM_DIRECT_SUCCESS:
    'Đã xác nhận nhập kho thành công! Tồn kho sợi đã được cập nhật.',
  MSG_SAVE_DRAFT_SUCCESS: 'Đã lưu phiếu nhập sợi ở trạng thái bản nháp.',

  // Formatters
  supplierConfidenceBadge: (percent: number) => `NCC: ${percent}% tin cậy`,
  catalogConfidenceBadge: (percent: number) => `Sợi: ${percent}% tương đồng`,
  discrepancyDetail: (actual: number, expected: number, diff: number) =>
    `Thực tế: ${actual}, Mong đợi: ${expected}, Lệch: ${diff}`,
} as const;
