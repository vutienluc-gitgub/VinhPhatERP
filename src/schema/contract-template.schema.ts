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
  SEARCH_PLACEHOLDER: 'Tìm kiếm mẫu văn bản...',
  ALL_CATEGORIES: 'Tất cả danh mục',
  SALE_TEMPLATE: 'Mẫu Bán hàng',
  PURCHASE_TEMPLATE: 'Mẫu Mua hàng',
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
