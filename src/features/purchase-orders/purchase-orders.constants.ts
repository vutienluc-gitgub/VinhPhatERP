export const PO_CONSTANTS = {
  // Common
  CURRENCY_VND: 'VND',
  CURRENCY_USD: 'USD',
  CURRENCY_EUR: 'EUR',

  // List Page
  PAGE_TITLE: 'Đơn đặt hàng',
  PAGE_SUBTITLE: 'Quản lý nhập hàng từ nhà cung cấp',
  BTN_CREATE_NEW: 'Tạo PO mới',

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
};
