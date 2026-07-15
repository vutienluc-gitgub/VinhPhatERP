import { z } from 'zod';

export const CONTRACT_TEMPLATE_MESSAGES = {
  CREATE_SUCCESS: 'Đã tạo mẫu hợp đồng mới.',
  CREATE_ERROR: 'Lỗi khi tạo: ',
  UPDATE_SUCCESS: 'Mẫu hợp đồng đã được cập nhật.',
  UPDATE_ERROR: 'Lỗi khi lưu: ',
  DELETE_SUCCESS: 'Đã xoá mẫu hợp đồng.',
  DELETE_ERROR: 'Lỗi khi xoá: ',
  SEED_LOADING: 'Đang khởi tạo mẫu mặc định...',
  SEED_SUCCESS: 'Khởi tạo mẫu mặc định thành công!',
  SEED_ERROR: 'Lỗi khởi tạo: ',
  NAME_REQUIRED: 'Tên mẫu không được để trống',
  CONTENT_REQUIRED: 'Nội dung mẫu không được để trống',
} as const;

export const CONTRACT_TEMPLATE_LABELS = {
  TITLE: 'Quản lý mẫu văn bản',
  DESCRIPTION:
    'Thiết lập mẫu hợp đồng tiêu chuẩn để tự động hoá quy trình ký kết',
  BTN_BACK: 'Quay lại',
  FILTER_TYPE: 'Phân loại',
  DUPLICATE_SUFFIX: '(Bản sao)',
  MENU_EDIT: 'Xem / Chỉnh sửa',
  MENU_DUPLICATE: 'Nhân bản mẫu',
  MENU_PAUSE: 'Tạm dừng mẫu',
  MENU_ACTIVATE: 'Kích hoạt mẫu',
  MENU_DELETE: 'Xóa mẫu',
  CONFIRM_DELETE_TITLE: 'Xóa mẫu hợp đồng',
  CONFIRM_DELETE_MSG:
    'Bạn có chắc chắn muốn xóa mẫu hợp đồng này không? Hành động này không thể hoàn tác.',
  CONFIRM_SAVE_TITLE: 'Lưu thay đổi mẫu văn bản',
  CONFIRM_CREATE_TITLE: 'Tạo mới mẫu văn bản',
  CONFIRM_SAVE_MSG:
    'Bạn có chắc chắn muốn lưu mẫu này không? Những bản in tiếp theo sẽ sử dụng nội dung mới.',
  BTN_SAVING: 'Đang lưu...',
  BTN_CONFIRM_SAVE: 'Xác nhận lưu',
  BTN_DELETE: 'Xóa',
  BTN_CANCEL: 'Hủy',
  BTN_SAVE: 'Lưu thay đổi',
  TEMPLATE_NAME: 'Tên mẫu',
  AVAILABLE_PLACEHOLDERS: 'Placeholders có sẵn',
  PLACEHOLDER_HINT:
    'Sao chép placeholder vào nội dung để tự động điền dữ liệu khi tạo hợp đồng.',
  HTML_CONTENT: 'Nội dung HTML',
  NO_CONTENT: 'Chưa có cấu hình nội dung.',
  VIEW_DETAIL: 'XEM CHI TIẾT',
  STATUS_ACTIVE: 'Đang hoạt động',
  STATUS_PAUSED: 'Tạm dừng',
  UPDATED_AT: 'Cập nhật: ',
  SEARCH_PLACEHOLDER: 'Tìm kiếm mẫu văn bản...',
  ALL_CATEGORIES: 'Tất cả danh mục',
  SALE_TEMPLATE: 'Mẫu Bán hàng',
  PURCHASE_TEMPLATE: 'Mẫu Mua hàng',
  MENU_CREATE_NEW: 'TẠO MẪU MỚI',
  MENU_SALE_TEMPLATE: 'Bản mẫu Bán hàng',
  MENU_PURCHASE_TEMPLATE: 'Bản mẫu Mua hàng',
  NO_RESULTS: 'Không tìm thấy mẫu phù hợp',
  NO_RESULTS_DESC: 'Dữ liệu không khớp với từ khóa',
  ERROR_PREFIX: 'Lỗi: ',
  LOADING: 'Đang tải dữ liệu mẫu...',
  EMPTY_TITLE: 'Hệ thống chưa có mẫu văn bản',
  EMPTY_DESC:
    'Khởi tạo các mẫu tiêu chuẩn để bắt đầu quản lý quy trình ký kết tự động.',
  SEED_BUTTON: 'Bắt đầu với mẫu tiêu chuẩn',
} as const;

export const contractTemplateEditorSchema = z.object({
  name: z.string().trim().min(1, CONTRACT_TEMPLATE_MESSAGES.NAME_REQUIRED),
  content: z.string().min(1, CONTRACT_TEMPLATE_MESSAGES.CONTENT_REQUIRED),
});

export type ContractTemplateEditorValues = z.infer<
  typeof contractTemplateEditorSchema
>;
