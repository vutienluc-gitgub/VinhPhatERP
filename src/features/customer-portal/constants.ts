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
