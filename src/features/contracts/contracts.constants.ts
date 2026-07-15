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
} as const;
