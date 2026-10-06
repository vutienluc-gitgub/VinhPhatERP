import type {
  OrderStatus,
  ProductionStage,
  StageStatus,
  QuotationStatus,
  ShipmentStatus,
} from '@/domain/portal/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_review: 'Chờ duyệt',
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang sản xuất',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending_review: 'portal-badge portal-badge--draft',
  draft: 'portal-badge portal-badge--draft',
  confirmed: 'portal-badge portal-badge--confirmed',
  in_progress: 'portal-badge portal-badge--in-progress',
  completed: 'portal-badge portal-badge--completed',
  cancelled: 'portal-badge portal-badge--cancelled',
};

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  warping: 'Mắc sợi',
  weaving: 'Dệt',
  greige_check: 'Kiểm vải mộc',
  dyeing: 'Nhuộm',
  finishing: 'Hoàn tất',
  final_check: 'Kiểm tra cuối',
  packing: 'Đóng gói',
};

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pending: 'Chờ',
  in_progress: 'Đang thực hiện',
  done: 'Hoàn thành',
  skipped: 'Bỏ qua',
};

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Nháp',
  sent: 'Đã gửi',
  confirmed: 'Đã duyệt',
  rejected: 'Từ chối',
  expired: 'Hết hạn',
  converted: 'Đã chuyển đơn hàng',
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  preparing: 'Đang chuẩn bị',
  shipped: 'Đã giao',
  delivered: 'Đã nhận',
  partially_returned: 'Trả một phần',
  returned: 'Đã trả',
};

export const TIMELINE_STEPS = [
  { key: 'created', label: 'Đã tạo' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'completed', label: 'Hoàn thành' },
] as const;

export const PORTAL_DASHBOARD_LABELS = {
  GREETING_MORNING: 'Chào buổi sáng,',
  GREETING_AFTERNOON: 'Chào buổi chiều,',
  GREETING_EVENING: 'Chào buổi tối,',
  PARTNER_BADGE: 'Doanh nghiệp đối tác',
  PORTAL_SUB: 'Cổng khách hàng B2B • Vĩnh Phát ERP',
  BTN_CATALOG: 'Tra cứu mẫu vải',
  BTN_QUOTATION: 'Gửi yêu cầu báo giá',
  QUICK_ACTIONS_TITLE: 'Phím tắt tác vụ nhanh',
  RECENT_ORDERS_TITLE: 'Đơn hàng gần đây',
  VIEW_ALL: 'Xem tất cả',
  VIEW_DETAILS: 'Chi tiết',
  ORDERS_LABEL: 'Đơn hàng',
  DEBT_LABEL: 'Công nợ hiện tại',
  SHIPMENT_LABEL: 'Giao hàng gần nhất',
  NO_SHIPMENT: 'Chưa có',
  EMPTY_ORDERS_TITLE: 'Chưa có đơn đặt hàng nào trong hệ thống',
  EMPTY_ORDERS_DESC:
    'Mọi đơn hàng kinh doanh được ký kết sẽ tự động đồng bộ và hiển thị chi tiết tiến độ tại đây.',
  SUPPORT_CARD_TITLE: 'Trung tâm hỗ trợ khách hàng',
  SUPPORT_CARD_DESC:
    'Đội ngũ chuyên viên Vĩnh Phát sẵn sàng hỗ trợ kỹ thuật và đơn hàng',
  HOTLINE_LABEL: 'Hotline CSKH',
  HOTLINE_VALUE: '028 3815 8888',
  EMAIL_LABEL: 'Email hỗ trợ',
  EMAIL_VALUE: 'cskh@vinhphat.com',
  HOURS_LABEL: 'Thời gian làm việc',
  HOURS_VALUE: 'Thứ 2 - Thứ 7 (08:00 - 17:30)',
  BTN_SUPPORT_CHAT: 'Trò chuyện với tư vấn viên',
} as const;
