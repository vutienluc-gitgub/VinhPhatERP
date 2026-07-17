export const CONTRACT_LABELS = {
  // General Info
  PARTY_A: 'Bên A',
  REP_A: 'Người đại diện A',
  TAX_CODE: 'MST',
  EFFECTIVE_DATE: 'Ngày hiệu lực',
  EXPIRY_DATE: 'Ngày hết hạn',
  PAYMENT_TERM: 'Điều khoản TT',
  NOTES: 'Ghi chú',

  // Lifecycle
  SENT_AT: 'Đã gửi',
  SIGNED_AT: 'Đã ký',
  CANCELLED_AT: 'Đã huỷ',
  VIEW_SIGNED_FILE: 'Xem file hợp đồng đã ký',
  PREVIEW_CONTENT: 'Xem trước nội dung hợp đồng',

  // Actions
  BTN_BACK: 'Quay lại',
  BTN_EDIT: 'Chỉnh sửa',
  BTN_SEND: 'Gửi hợp đồng',
  BTN_SIGN: 'Xác nhận đã ký',
  BTN_EXPORT_PDF: 'Xuất PDF',
  BTN_LINK_ORDER: 'Liên kết đơn hàng',
  BTN_CANCEL: 'Hủy hợp đồng',
  BTN_CREATE_NEW: 'Tạo hợp đồng mới',
  BTN_CANCEL_ACTION: 'Hủy',
  BTN_CREATING: 'Đang tạo...',
  BTN_CREATE: 'Tạo hợp đồng',

  // Form Labels
  SOURCE: 'Nguồn',
  ORDER: 'Đơn hàng',
  CUSTOMER: 'Khách hàng',
  SUPPLIER: 'Nhà cung cấp',
  CONTRACT_TYPE: 'Loại hợp đồng',
  PAYMENT_TERM_PLACEHOLDER: 'VD: Thanh toán 30 ngày sau khi giao hàng',
  NOTES_PLACEHOLDER: 'Ghi chú thêm...',

  // Edit Sheet Labels
  EDIT_TITLE: 'Chỉnh sửa hợp đồng',
  BTN_EXIT: 'Thoát',
  BTN_SAVE: 'Lưu thay đổi',
  PARTY_A_INFO: 'Thông tin Bên A',
  PARTY_B_INFO: 'Thông tin Bên B (Vĩnh Phát)',
  PARTY_A_NAME: 'Tên bên A',
  PARTY_B_NAME: 'Tên bên B',
  PARTY_A_TAX: 'MST bên A',
  PARTY_B_TAX: 'MST bên B',
  PARTY_A_ADDRESS: 'Địa chỉ bên A',
  PARTY_B_ADDRESS: 'Địa chỉ bên B',
  PARTY_A_REP: 'Người đại diện bên A',
  PARTY_B_REP: 'Người đại diện bên B',
  PARTY_A_TITLE: 'Chức vụ',
  PARTY_B_BANK: 'Tài khoản ngân hàng',
  TERMS_SECTION: 'Điều khoản',

  // Sheet Labels
  CANCEL_TITLE: 'Hủy hợp đồng',
  CANCEL_REASON_PLACEHOLDER:
    'Vui lòng nhập lý do hủy hợp đồng (không bắt buộc)',
  BTN_CONFIRM_CANCEL: 'Xác nhận hủy',
  SIGN_TITLE: 'Xác nhận hợp đồng đã ký',
  SIGN_FILE_URL_PLACEHOLDER: 'Link file hợp đồng (nếu có)',
  BTN_CONFIRM: 'Xác nhận',
  LINK_ORDER_TITLE: 'Liên kết đơn hàng',
  LINK_ORDER_SELECT: 'Vui lòng chọn đơn hàng cần liên kết',
  BTN_LINK: 'Liên kết',
  BTN_CLOSE: 'Đóng',
} as const;

export const CONTRACT_MESSAGES = {
  LOADING: 'Đang tải...',
  ERROR: 'Lỗi',
  NO_DATA: 'Không tìm thấy hợp đồng.',
  SOMETHING_WENT_WRONG: 'Có lỗi xảy ra',

  // Validation
  ERR_SELECT_SOURCE: 'Vui lòng chọn nguồn',
  ERR_SELECT_TYPE: 'Vui lòng chọn loại hợp đồng',
  ERR_DATE_RANGE: 'Ngày hết hạn phải sau ngày hiệu lực',

  // Confirms
  CONFIRM_SEND: 'Xác nhận đã gửi hợp đồng cho đối tác?',
  CONFIRM_UNLINK: 'Hủy liên kết đơn hàng',

  // Toasts
  TOAST_SENT: 'Đã cập nhật trạng thái: Đã gửi',
  TOAST_CANCELLED: 'Đã huỷ hợp đồng',
  TOAST_SIGNED: 'Đã xác nhận hợp đồng đã ký',
  TOAST_CREATED_SUCCESS: 'Tạo hợp đồng {number} thành công',

  TITLE: 'Hợp đồng',
  SUBTITLE: 'Quản lý hợp đồng đối tác',
  NEW_BUTTON: 'Tạo hợp đồng mới',
  KPI_TOTAL: 'Tổng hợp đồng',
  KPI_TOTAL_DESC: 'Tất cả hợp đồng trong hệ thống',
  KPI_SIGNED: 'Đã ký',
  KPI_SIGNED_DESC: 'Hợp đồng đã được ký kết',
  KPI_PENDING: 'Chờ xử lý',
  KPI_PENDING_DESC: 'Nháp / Đã gửi',
  FILTER_SEARCH: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Số hợp đồng, tên đối tác...',
  FILTER_STATUS: 'Trạng thái',
  FILTER_TYPE: 'Loại hợp đồng',
  FILTER_DATE_FROM: 'Từ ngày',
  FILTER_DATE_TO: 'Đến ngày',
  EMPTY_FILTER_TITLE: 'Không tìm thấy hợp đồng',
  EMPTY_FILTER_DESC: 'Vui lòng thử điều chỉnh lại bộ lọc.',
  EMPTY_TITLE: 'Chưa có hợp đồng nào',
  EMPTY_DESC: 'Nhấn nút tạo hợp đồng mới để bắt đầu.',
  ERROR_LOAD: 'Lỗi tải dữ liệu: ',

  COL_CONTRACT_NUMBER: 'Số hợp đồng',
  COL_TYPE: 'Loại',
  COL_PARTY_A: 'Bên A (Đối tác)',
  COL_STATUS: 'Trạng thái',
  COL_CREATED_AT: 'Ngày tạo',
  COL_ACTIONS: 'Thao tác',
  ACTION_VIEW_DETAILS: 'Xem chi tiết',

  AUDIT_CREATED: 'Hợp đồng được tạo',
  AUDIT_UPDATED: 'Cập nhật thông tin',
  AUDIT_STATUS_CHANGED: 'Chuyển trạng thái',
  AUDIT_ORDER_LINKED: 'Liên kết đơn hàng',
  AUDIT_ORDER_UNLINKED: 'Hủy liên kết đơn hàng',
  LBL_NEW_STATUS: 'Trạng thái mới: ',
  LBL_REASON: 'Lý do: ',
  TITLE_ACTIVITY: 'Lịch sử hoạt động',
  MSG_LOADING: 'Đang tải...',
  MSG_NO_ACTIVITY: 'Chưa có hoạt động nào.',

  TITLE_LINKED_ORDERS: (count: number) => `Đơn hàng liên kết (${count})`,
  MSG_NO_LINKED_ORDERS: 'Chưa có đơn hàng nào được liên kết.',
  COL_ORDER_NUMBER: 'Số đơn hàng',
  COL_ORDER_STATUS: 'Trạng thái',
  COL_LINK_DATE: 'Ngày liên kết',

  LBL_CONTRACT_NUMBER: 'Số hợp đồng: ',
  TAX_CODE_LABEL: 'MST: ',
  LBL_CONTRACT_PREVIEW: (contractNumber?: string) =>
    contractNumber ? `Hợp đồng ${contractNumber}` : 'Xem trước hợp đồng',

  ERR_SIGNED_NO_EDIT: 'Hợp đồng đã ký không thể chỉnh sửa.',
  ERR_INVALID_TRANSITION: (current: string, status: string) =>
    `Không thể chuyển trạng thái từ "${current}" sang "${status}".`,
  ERR_REASON_REQUIRED: 'Vui lòng nhập lý do huỷ hợp đồng.',
  ERR_SIGNED_NO_LINK_CHANGE:
    'Không thể thay đổi liên kết đơn hàng sau khi hợp đồng đã ký.',

  CREATE_NEW_CONTRACT_TITLE: 'Tạo hợp đồng mới',
} as const;
