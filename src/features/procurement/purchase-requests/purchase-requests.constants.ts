import type { BadgeVariant } from '@/shared/components';
import type { KpiVariant } from '@/shared/components/KpiCard';

export const PR_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  submitted: 'Đã gửi duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  sourcing: 'Đang tìm nguồn',
  fulfilled: 'Đã hoàn tất',
};

export const PR_STATUS_COLORS: Record<string, BadgeVariant> = {
  draft: 'gray',
  submitted: 'warning',
  approved: 'info',
  rejected: 'danger',
  sourcing: 'purple',
  fulfilled: 'success',
};

export const PR_PRIORITY_LABELS: Record<string, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export const PR_PRIORITY_COLORS: Record<string, BadgeVariant> = {
  low: 'gray',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

export const PR_KPI_VARIANTS: Record<string, KpiVariant> = {
  total: 'primary',
  draft: 'secondary',
  submitted: 'warning',
};

export const PR_LABELS = {
  /* ── List page ── */
  LIST_TITLE: 'Yêu cầu mua hàng (PR)',
  LIST_DESCRIPTION: 'Quản lý nhu cầu vật tư từ nội bộ',
  ADD_BUTTON: 'Tạo PR',
  EMPTY_TITLE: 'Chưa có yêu cầu mua hàng',
  EMPTY_DESC: 'Tạo PR đầu tiên để bắt đầu quy trình thu mua.',
  EMPTY_SEARCH_TITLE: 'Không tìm thấy kết quả',
  EMPTY_SEARCH_DESC: 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.',
  ERROR_PREFIX: 'Không thể tải dữ liệu:',

  /* ── Columns ── */
  COL_PR_NO: 'Mã PR',
  COL_DEPT: 'Bộ phận',
  COL_PRIORITY: 'Mức ưu tiên',
  COL_STATUS: 'Trạng thái',
  COL_CREATED_AT: 'Ngày tạo',
  COL_ACTIONS: 'Thao tác',

  /* ── Actions ── */
  ACTION_DELETE: 'Xóa',
  CONFIRM_DELETE: 'Bạn có chắc muốn xóa yêu cầu mua hàng này?',

  /* ── KPI ── */
  KPI_TOTAL: 'Tổng PR',
  KPI_DRAFT: 'Nháp',
  KPI_SUBMITTED: 'Chờ duyệt',

  /* ── Filters ── */
  FILTER_SEARCH: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Tìm theo mã PR, bộ phận...',
  FILTER_STATUS: 'Trạng thái',
  FILTER_PRIORITY: 'Mức ưu tiên',

  /* ── Create page ── */
  CREATE_TITLE: 'Tạo Yêu cầu mua hàng',
  CREATE_DESCRIPTION: 'Lập danh sách các vật tư cần mua',
  FIELD_DEPT: 'Bộ phận yêu cầu',
  FIELD_DEPT_PLACEHOLDER: 'VD: Kho vật tư, Sản xuất...',
  FIELD_PRIORITY: 'Mức ưu tiên',
  FIELD_NOTES: 'Ghi chú',
  FIELD_NOTES_PLACEHOLDER: 'Ghi chú nội bộ về yêu cầu này...',
  ITEM_SECTION_TITLE: 'Danh sách vật tư cần mua',
  ITEM_ADD: 'Thêm dòng',
  ITEM_REMOVE: 'Xóa dòng',
  ITEM_MATERIAL_NAME: 'Tên vật tư',
  ITEM_MATERIAL_NAME_PLACEHOLDER: 'VD: Sợi Cotton 30/1',
  ITEM_SPECS: 'Quy cách',
  ITEM_SPECS_PLACEHOLDER: 'VD: Ne 30/1, Pima',
  ITEM_QTY: 'Số lượng',
  ITEM_UOM: 'ĐVT',
  ITEM_UOM_PLACEHOLDER: 'VD: kg, cuộn',
  ITEM_EXPECTED_DATE: 'Ngày cần',
  ITEM_PURPOSE: 'Mục đích',
  ITEM_PURPOSE_PLACEHOLDER: 'VD: Cho đơn hàng SO-0042',
  SUBMIT_BUTTON: 'Lưu PR',
  CANCEL_BUTTON: 'Hủy',
  SUBMIT_SUCCESS: 'Đã tạo yêu cầu mua hàng thành công!',

  /* ── Pagination ── */
  PAGINATION_ITEM: 'yêu cầu',
};

export const UOM_OPTIONS = [
  { value: 'kg', label: 'Kg' },
  { value: 'cuon', label: 'Cuộn' },
  { value: 'met', label: 'Mét' },
  { value: 'cai', label: 'Cái' },
  { value: 'thung', label: 'Thùng' },
  { value: 'chai', label: 'Chai' },
  { value: 'lit', label: 'Lít' },
  { value: 'bo', label: 'Bộ' },
];
