export const PO_CONSTANTS = {
  // Common
  CURRENCY_VND: 'VND',
  CURRENCY_USD: 'USD',
  CURRENCY_EUR: 'EUR',

  // List Page
  PAGE_TITLE: 'Đơn đặt hàng',
  PAGE_SUBTITLE: 'Quản lý nhập hàng từ nhà cung cấp',
  BTN_CREATE_NEW: 'Tạo PO mới',

  // Document Type / Attachments
  LABEL_DOCUMENT_TYPE: 'Loại chứng từ',
  DOC_TYPE_INV: 'Invoice (INV)',
  DOC_TYPE_PL: 'Packing List (PL)',
  DOC_TYPE_BL: 'Bill of Lading (BL)',
  DOC_TYPE_CQ: 'Chứng nhận chất lượng (C/Q)',
  DOC_TYPE_CO: 'Chứng nhận xuất xứ (C/O)',
  DOC_TYPE_CONTRACT: 'Hợp đồng (Contract)',
  DOC_TYPE_OTHER: 'Khác',

  // PO Approval Workflow Labels
  APPROVAL_ACTION: 'Thao tác',
  APPROVAL_PRINT_PO: 'In PO',
  APPROVAL_EXPORT_PDF: 'Xuất PDF',
  APPROVAL_SUBMIT: 'Trình duyệt',
  APPROVAL_APPROVE: 'Duyệt PO',
  APPROVAL_OVER_LIMIT: 'Vượt hạn mức duyệt của bạn',
  APPROVAL_REQUEST_CHANGES: 'Yêu cầu sửa',
  APPROVAL_REJECT: 'Từ chối',
  APPROVAL_CREATE_GR: 'Tạo phiếu nhập kho (GR)',
  APPROVAL_HISTORY_TITLE: 'Lịch sử duyệt (Approval History)',
  APPROVAL_SYSTEM_USER: 'Hệ thống',
  APPROVAL_LOG_APPROVED: 'Đã duyệt',
  APPROVAL_LOG_REJECTED: 'Từ chối',
  APPROVAL_LOG_REQUEST_CHANGES: 'Yêu cầu sửa đổi',
  APPROVAL_LOG_SUBMITTED: 'Đã gửi duyệt',
  APPROVAL_SEND_SUPPLIER: 'Gửi Nhà cung cấp',
  APPROVAL_NCC_CONFIRM: 'NCC Xác nhận đơn',

  // PO Approval Messages
  MSG_SUBMIT_SUCCESS: 'Gửi yêu cầu duyệt thành công',
  MSG_SUBMIT_FAIL: 'Gửi thất bại: ',
  MSG_APPROVE_SUCCESS: 'Duyệt đơn đặt hàng thành công',
  MSG_APPROVE_FAIL: 'Duyệt thất bại: ',
  MSG_REQUEST_CHANGES_SUCCESS: 'Yêu cầu sửa đổi thành công',
  MSG_REJECT_SUCCESS: 'Từ chối đơn đặt hàng thành công',
  MSG_ACTION_FAIL: 'Thao tác thất bại: ',
  MSG_PO_NOT_FOUND: 'Không tìm thấy PO.',
  MSG_PO_DETAIL_TITLE: 'Chi tiết Đơn đặt hàng',
  MSG_SUPPLIER_PREFIX: 'NCC: ',
  MSG_BACK: 'Trở về',
  MSG_SEND_SUCCESS: 'Đã chuyển trạng thái sang Đang gửi nhà cung cấp',
  MSG_SEND_FAIL: 'Gửi thất bại: ',
  MSG_CONFIRM_SUCCESS: 'Nhà cung cấp đã xác nhận PO thành công',
  MSG_CONFIRM_FAIL: 'Xác nhận thất bại: ',
  MSG_APPROVE_SEND_SUCCESS: 'Đã duyệt và gửi nhà cung cấp thành công',

  // PO Approve Modal
  MODAL_APPROVE_TITLE: 'Duyệt Đơn đặt hàng',
  MODAL_APPROVE_DESC:
    'Bạn có chắc chắn muốn duyệt đơn đặt hàng này không? Bạn có thể nhập thêm ghi chú (nếu có).',
  MODAL_APPROVE_NOTE_LABEL: 'Ghi chú (Tùy chọn)',
  MODAL_APPROVE_NOTE_PLACEHOLDER: 'Nhập ghi chú duyệt...',
  MODAL_APPROVE_AUTO_SEND: 'Tự động gửi đơn cho Nhà cung cấp (Approve & Send)',
  MODAL_APPROVE_CANCEL: 'Hủy',
  MODAL_APPROVE_CONFIRM: 'Xác nhận duyệt',

  // Table Columns
  COL_PO_CODE: 'Mã PO',
  COL_ORDER_DATE: 'Ngày đặt',
  COL_SUPPLIER: 'Nhà cung cấp',
  COL_TOTAL_AMOUNT: 'Tổng tiền',
  COL_STATUS: 'Trạng thái',
  COL_PROGRESS: 'Tiến độ',
  COL_ACTIONS: 'Thao tác',
  ACTION_VIEW_DETAIL: 'Xem chi tiết',

  // Status Labels
  STATUS_DRAFT: 'Nháp',
  STATUS_APPROVED: 'Đã duyệt',
  STATUS_PARTIAL: 'Nhập 1 phần',
  STATUS_COMPLETED: 'Hoàn tất',
  STATUS_REJECTED: 'Từ chối',
  STATUS_CANCELLED: 'Đã huỷ',

  // Create Page
  CREATE_PAGE_TITLE: 'Tạo Đơn Đặt Hàng',
  SECTION_GENERAL: 'Thông tin chung',
  SECTION_ITEMS: 'Danh sách nguyên liệu',
  SECTION_PAYMENT: 'Tổng thanh toán',

  // Form Labels
  LABEL_SUPPLIER: 'Nhà cung cấp',
  LABEL_PIC: 'Người phụ trách',
  LABEL_PAYMENT_TERMS: 'Điều khoản TT',
  LABEL_ORDER_DATE: 'Ngày đặt hàng',
  LABEL_CURRENCY: 'Loại tiền',
  LABEL_PAYMENT_DEADLINE: 'Hạn thanh toán',
  LABEL_VAT_TERMS: 'Điều khoản VAT',
  LABEL_INCOTERMS: 'Giao hàng (Incoterms)',
  LABEL_PRIORITY: 'Mức độ ưu tiên',
  LABEL_ATTACHMENTS: 'Tài liệu đính kèm (Kéo thả hoặc click)',

  // Items Grid
  BTN_ADD_ROW: '+ Thêm dòng',
  BTN_IMPORT_EXCEL: 'Import Excel',
  BTN_COPY_BOM: 'Copy BOM',
  TIP_KEYBOARD_NAV:
    'Mẹo: Sử dụng phím Tab hoặc Enter để chuyển nhanh giữa các ô.',

  // Payment Panel
  SUBTOTAL: 'Tiền hàng (Subtotal)',
  VAT_RATE: 'Thuế VAT (%)',
  SHIPPING_FEE: 'Chi phí vận chuyển',
  GRAND_TOTAL: 'Tổng cộng',
  BTN_CONFIRM_CREATE: 'Xác nhận Tạo PO',

  // Form placeholders/messages
  SELECT_SUPPLIER: 'Chọn nhà cung cấp...',
  AUTO_GENERATED: 'Tự động tạo',
  PRIORITY_NORMAL: 'Bình thường',
  PRIORITY_HIGH: 'Cao',
  PRIORITY_URGENT: 'Khẩn cấp',

  // Messages
  ERR_CREATE_FAILED: 'Có lỗi xảy ra khi tạo PO: ',
  ERR_FORM_VALIDATION: 'Vui lòng kiểm tra lại thông tin bị lỗi màu đỏ',
  ERR_MATERIAL_REQUIRED: 'Vui lòng chọn nguyên liệu từ danh sách',

  // Form Options
  UOM_OPTIONS: ['kg', 'cây', 'mét', 'cuộn'] as const,
  CURRENCY_OPTIONS: ['VND', 'USD', 'EUR'] as const,
  PAYMENT_TERMS_OPTIONS: [
    { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)' },
    { value: 'NET15', label: 'Trả sau 15 ngày (NET15)' },
    { value: 'NET30', label: 'Trả sau 30 ngày (NET30)' },
    { value: 'NET60', label: 'Trả sau 60 ngày (NET60)' },
    { value: 'TT', label: 'Chuyển khoản trước (T/T)' },
  ] as const,
  INCOTERMS_OPTIONS: [
    { value: 'EXW', label: 'EXW - Giao tại xưởng' },
    { value: 'FOB', label: 'FOB - Giao lên tàu' },
    { value: 'CIF', label: 'CIF - Giao tại cảng đích' },
    { value: 'DDP', label: 'DDP - Giao đã nộp thuế' },
  ] as const,

  // Additional Labels
  LABEL_EXPECTED_DATE: 'Ngày dự kiến giao',
  LABEL_SUPPLIER_REF: 'Số Tham Chiếu (Supplier Ref)',
  LABEL_DELIVERY_WAREHOUSE: 'Kho nhận hàng',
  LABEL_TRADE_TYPE: 'Loại giao dịch',
  TRADE_TYPE_DOMESTIC: 'Trong nước',
  TRADE_TYPE_IMPORT: 'Nhập khẩu',
  SECTION_TRADE_SUPPLIER: 'Nhà cung cấp & Giao dịch',
  SECTION_LOGISTICS: 'Logistics & Vận chuyển',
  SECTION_PAYMENT_TERMS: 'Điều khoản thanh toán',

  // Placeholders
  PLACEHOLDER_PIC: 'VD: NV01 - Nguyễn Văn A',
  PLACEHOLDER_SUPPLIER_REF: 'Mã báo giá / PO của NCC',
  PLACEHOLDER_MATERIAL: 'Nhập mã/tên...',
  SELECT_DEFAULT: '-- Chọn --',

  // Grid Columns
  COL_MATERIAL: 'Mã / Tên nguyên liệu',
  COL_UOM: 'ĐVT',
  COL_QTY: 'Số lượng',
  COL_UNIT_PRICE: 'Đơn giá',
  COL_LINE_TOTAL: 'Thành tiền',

  // Attachments
  UPLOAD_HINT_MAIN: 'Kéo thả file hợp đồng, báo giá vào đây',
  UPLOAD_HINT_SUB: 'Hỗ trợ PDF, JPG, PNG (Tối đa 10MB)',

  // Success / Info Messages
  MSG_CREATE_SUCCESS: 'thành công',
  MSG_MOQ_REQUIRED: 'yêu cầu MOQ:',
  MSG_FOR_MATERIAL: 'cho mã',
  MSG_NO_MATERIAL_FOUND: 'Không tìm thấy vật tư',
  MSG_PRICE_HIGHER_THAN_CONTRACT: 'Cao hơn giá HĐ',
  BTN_DUPLICATE_ROW: 'Nhân bản dòng',
  BTN_DELETE_ROW: 'Xóa dòng',

  // Goods Receipt Form
  GR_TITLE: 'Nhập kho (Goods Receipt)',
  GR_DATE: 'Ngày nhập kho',
  GR_COL_MATERIAL: 'Nguyên liệu',
  GR_COL_ORDERED: 'SL Đặt',
  GR_COL_REMAINING: 'Còn lại',
  GR_COL_RECEIVED: 'SL Thực nhận',
  GR_BTN_CONFIRM: 'Xác nhận nhập kho',
  GR_MSG_NO_QTY: 'Vui lòng nhập số lượng cho ít nhất 1 mặt hàng',
  GR_MSG_SUCCESS: 'Nhập kho thành công',
  GR_MSG_ERROR: 'Có lỗi xảy ra khi nhập kho',
  GR_ALL_RECEIVED: 'Tất cả mặt hàng đã được nhập đủ.',
  GR_ERROR_LABEL: 'Lỗi',
};
