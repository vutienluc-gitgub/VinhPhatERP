import type { BadgeVariant } from '@/shared/components';
import type { KpiVariant } from '@/shared/components/KpiCard';

export const RFQ_STATUS_LABELS: Record<string, string> = {
  open: 'Đang mở',
  closing_soon: 'Sắp đóng',
  closed: 'Đã đóng',
  awarded: 'Đã chốt (Awarded)',
};

export const RFQ_STATUS_COLORS: Record<string, BadgeVariant> = {
  open: 'success',
  closing_soon: 'warning',
  closed: 'gray',
  awarded: 'info',
};

export const RFQ_KPI_VARIANTS: Record<string, KpiVariant> = {
  total: 'primary',
  open: 'success',
  closed: 'secondary',
};

export const RFQ_LABELS = {
  /* ── List page ── */
  LIST_TITLE: 'Yêu cầu báo giá (RFQ)',
  LIST_DESCRIPTION: 'Quản lý các đợt tìm nguồn cung và thu thập báo giá',
  ADD_BUTTON: 'Tạo RFQ',
  EMPTY_TITLE: 'Chưa có đợt tìm nguồn nào',
  EMPTY_DESC: 'Tạo RFQ đầu tiên để gửi yêu cầu báo giá cho nhà cung cấp.',
  EMPTY_SEARCH_TITLE: 'Không tìm thấy kết quả',
  EMPTY_SEARCH_DESC: 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.',
  ERROR_PREFIX: 'Không thể tải dữ liệu:',

  /* ── Columns ── */
  COL_RFQ_CODE: 'Mã RFQ',
  COL_TITLE: 'Tiêu đề',
  COL_DEADLINE: 'Hạn chót',
  COL_STATUS: 'Trạng thái',
  COL_CREATED_AT: 'Ngày tạo',
  COL_PR_CODE: 'Mã PR / Yêu cầu',
  COL_ACTIONS: 'Thao tác',
  COL_MAP_MATERIAL: 'Map Vật tư (Bắt buộc)',
  COL_MATERIAL_SPEC: 'Quy cách',
  COL_QTY: 'S.Lượng',

  /* ── Actions ── */
  ACTION_VIEW: 'Chi tiết',
  ACTION_DELETE: 'Xóa',
  CONFIRM_DELETE: 'Bạn có chắc muốn xóa RFQ này?',

  /* ── KPI ── */
  KPI_TOTAL: 'Tổng RFQ',
  KPI_OPEN: 'Đang mở',
  KPI_CLOSED: 'Đã đóng',

  /* ── Filters ── */
  FILTER_SEARCH: 'Tìm kiếm',
  FILTER_SEARCH_PLACEHOLDER: 'Tìm theo mã, tiêu đề...',
  FILTER_STATUS: 'Trạng thái',

  /* ── Create page ── */
  CREATE_TITLE: 'Tạo đợt tìm nguồn (RFQ)',
  CREATE_DESCRIPTION: 'Gom nhóm các nhu cầu vật tư thành một yêu cầu báo giá',
  FIELD_TITLE: 'Tiêu đề đợt tìm nguồn',
  FIELD_TITLE_PLACEHOLDER: 'VD: Tìm nguồn mua sợi Q3/2026',
  FIELD_DEADLINE: 'Hạn chót báo giá',
  FIELD_NOTES: 'Ghi chú / Yêu cầu thêm',
  FIELD_NOTES_PLACEHOLDER: 'Ghi chú cho các nhà cung cấp...',
  PR_SELECTION_TITLE: 'Chọn vật tư từ các Yêu cầu (PR) đã duyệt',
  PR_SELECTION_DESC: 'Chỉ hiển thị các vật tư chưa được tìm nguồn.',
  SUBMIT_BUTTON: 'Tạo RFQ',
  CANCEL_BUTTON: 'Hủy',
  SUBMIT_SUCCESS: 'Đã tạo RFQ thành công!',
  NO_PENDING_ITEMS: 'Không có vật tư nào đang chờ tìm nguồn.',

  /* ── Detail page ── */
  DETAIL_TITLE_PREFIX: 'Chi tiết RFQ:',
  DETAIL_DEADLINE: 'Hạn chót:',
  TAB_ITEMS: 'Danh sách mặt hàng',
  TAB_SUPPLIERS: 'Nhà cung cấp báo giá',
  TAB_SUPPLIERS_PLACEHOLDER: 'Chức năng báo giá của NCC sẽ có ở Phase 2.',

  /* ── RFQ Detail ── */
  DETAIL_LOADING: 'Đang tải dữ liệu RFQ...',
  DETAIL_NOT_FOUND: 'Không tìm thấy RFQ.',
  BACK_TO_LIST: 'Quay lại danh sách',
  ACTION_WARN_CLOSING: 'Cảnh báo sắp đóng',
  ACTION_CLOSE_RFQ: 'Đóng yêu cầu',
  WARN_CLOSED_OR_AWARDED: 'Yêu cầu báo giá đã chốt hoặc hủy.',
  SECTION_GENERAL_INFO: 'Thông tin chung',
  SHARE_QR_CODE: 'Chia sẻ QR Code cho NCC',
  QR_HELPER_TEXT: 'Quét mã để mở form báo giá (Dành cho NCC)',

  /* ── Quote Tab ── */
  QUOTE_ERR_LOAD: 'Đã có lỗi xảy ra khi tải danh sách báo giá.',
  QUOTE_EMPTY_TITLE: 'Chưa có báo giá nào được gửi',
  QUOTE_EMPTY_DESC: 'Các báo giá từ Nhà cung cấp sẽ tự động hiển thị tại đây.',
  CONFIRM_AWARD:
    'Bạn có chắc chắn muốn chốt báo giá này? Báo giá khác sẽ bị từ chối.',
  SUCCESS_AWARD: 'Đã chốt báo giá thành công!',
  CONFIRM_CREATE_PO:
    'Bạn có muốn tạo Đơn mua hàng (PO) cho báo giá này ngay không?',
  BADGE_AWARDED: 'Đã chốt (Awarded)',
  BADGE_REJECTED: 'Bị từ chối',
  BADGE_PENDING: 'Đang chờ',
  LBL_NOTES: 'Ghi chú: ',
  LBL_TOTAL_TEMP: 'Tổng giá trị (Tạm tính)',
  BTN_AWARD_THIS: 'Chốt báo giá này',
  COL_MATERIAL: 'Vật tư',
  COL_QTY_OFFERED: 'SL Cung cấp',
  COL_PRICE_VND: 'Đơn giá (VND)',
  COL_TOTAL: 'Thành tiền',
  COL_NOTES: 'Ghi chú',
  TXT_UNKNOWN_MATERIAL: 'Vật tư không xác định',
  TXT_ORIGINAL_REQ: '*Yêu cầu ban đầu:',
  QR_TITLE: 'QR Code cho Nhà cung cấp',
  QR_DESC: 'Quét mã này để gửi báo giá',
  QR_DOMAIN:
    import.meta.env.VITE_SUPPLIER_PORTAL_URL ||
    'https://thumua.detmayvinhphat.com',

  /* ── Pagination ── */
  PAGINATION_ITEM: 'yêu cầu',
};
