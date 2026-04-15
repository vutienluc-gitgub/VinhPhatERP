import type {
  OrderStatus,
  ProductionStage,
  StageStatus,
  QuotationStatus,
} from './types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_review: 'Chờ duyệt',
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang sản xuất',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
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

export function mapOrderStatus(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function mapProductionStage(stage: ProductionStage): string {
  return PRODUCTION_STAGE_LABELS[stage] ?? stage;
}

export function mapStageStatus(status: StageStatus): string {
  return STAGE_STATUS_LABELS[status] ?? status;
}

export function mapQuotationStatus(status: QuotationStatus): string {
  return QUOTATION_STATUS_LABELS[status] ?? status;
}
