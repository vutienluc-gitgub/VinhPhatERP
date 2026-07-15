export const EMPLOYEE_MESSAGES = {
  // Employee Form
  FORM_ADD_SUCCESS: 'Thêm nhân viên thành công',
  FORM_UPDATE_SUCCESS: 'Cập nhật nhân viên thành công',
  FORM_ERROR: 'Có lỗi xảy ra',
  FORM_INVALID: 'Vui lòng kiểm tra lại thông tin nhập hợp lệ',
  FORM_LINK_WARN: 'Lưu hồ sơ thành công nhưng lỗi khi liên kết tài khoản',

  // Role Form
  ROLE_ADD_SUCCESS: 'Đã thêm vai trò mới',
  ROLE_UPDATE_SUCCESS: 'Đã cập nhật vai trò',
  ROLE_DELETE_SUCCESS: 'Đã xóa vai trò',
  ROLE_EMPTY_NAME: 'Tên vai trò không được để trống',

  // List Page
  LOAD_ERROR: 'Đã xảy ra lỗi khi tải danh sách nhân viên.',
} as const;

export const EMPLOYEE_LABELS = {
  // Common
  BTN_SAVE: 'Lưu',
  BTN_CANCEL: 'Hủy',
  BTN_CREATE: 'Thêm mới',
  BTN_EDIT: 'Sửa',
  BTN_DELETE: 'Xóa',
  BTN_DEACTIVATE: 'Ngừng hoạt động',
  BTN_MANAGE_ROLE: 'Quản lý vai trò',

  // Status
  STATUS_ACTIVE: 'Hoạt động',
  STATUS_INACTIVE: 'Ngừng hoạt động',

  // KPI Dashboard
  KPI_TOTAL: 'Tổng nhân viên',
  KPI_TOTAL_SUB: 'Thuộc các phòng ban',
  KPI_ACTIVE: 'Đang hoạt động',
  KPI_ACTIVE_SUB: 'Người dùng kích hoạt',
  KPI_SALES: 'Kinh doanh (Sales)',
  KPI_SALES_SUB: 'Nhân viên kinh doanh',
  KPI_DRIVER: 'Tài xế (Driver)',
  KPI_DRIVER_SUB: 'Nhân viên giao nhận',

  // Filters
  FILTER_SEARCH: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Tên, mã, SĐT...',
  FILTER_ROLE: 'Vai trò',

  // Table
  TABLE_CODE: 'Mã NV',
  TABLE_NAME: 'Họ tên',
  TABLE_PHONE: 'SĐT',
  TABLE_ROLE: 'Vai trò',
  TABLE_STATUS: 'Trạng thái',
  TABLE_ACTIONS: 'Thao tác',
  TABLE_MOBILE_CONTACT: 'Liên hệ:',

  // Empty State
  EMPTY_SEARCH_TITLE: 'Không tìm thấy nhân viên',
  EMPTY_SEARCH_DESC: 'Vui lòng thử điều chỉnh lại bộ lọc.',
  EMPTY_DATA_TITLE: 'Chưa có dữ liệu nhân viên',
  EMPTY_DATA_DESC: 'Hãy thêm nhân viên mới để bắt đầu quản lý.',
  EMPTY_ACTION: '+ Thêm nhân viên',

  // Dialogs
  DEACTIVATE_TITLE: 'Ngừng hoạt động nhân viên?',
  DEACTIVATE_MESSAGE: (name: string) =>
    `Bạn có chắc chắn muốn vô hiệu hóa nhân viên "${name}"? Có thể mở lại sau.`,
  DELETE_ROLE_TITLE: 'Xóa vai trò',

  // Employee Form
  FORM_ADD_TITLE: 'Thêm nhân viên mới',
  FORM_EDIT_TITLE: 'Cập nhật nhân viên',
  FORM_NAME_PLACEHOLDER: 'Nhập họ tên',
  FORM_PHONE_PLACEHOLDER: 'Ví dụ: 0912345678',

  // Role Management
  ROLE_MODAL_TITLE: 'Quản lý vai trò (Dynamic Roles)',
  ROLE_FORM_CODE_PLACEHOLDER: 'Mã vai trò',
  ROLE_FORM_NAME_PLACEHOLDER: 'VD: Kế toán',
  ROLE_TABLE_CODE: 'Mã',
  ROLE_TABLE_NAME: 'Tên hiển thị',
  ROLE_TABLE_ACTIONS: 'Thao tác',
  ROLE_VALIDATION_CODE_EMPTY: 'Vui lòng nhập mã vai trò',
  ROLE_VALIDATION_CODE_REGEX: 'Mã chỉ chứa chữ thường, số và dấu gạch dưới',
  ROLE_VALIDATION_NAME_EMPTY: 'Vui lòng nhập tên hiển thị',
} as const;
