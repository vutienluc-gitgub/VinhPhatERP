import type {
  SampleStatus,
  StockStatus,
  StatusConfig,
} from './status-badge.types';

export const SAMPLE_STATUS_CONFIG = {
  AVAILABLE: { label: 'Có sẵn mẫu', variant: 'success' },
  OUT_OF_STOCK: { label: 'Tạm hết mẫu', variant: 'danger' },
  PREPARING: { label: 'Đang chuẩn bị mẫu', variant: 'warning' },
} satisfies Record<SampleStatus, StatusConfig>;

export const STOCK_STATUS_CONFIG = {
  READY: { label: 'Có sẵn hàng', variant: 'info' },
  CUSTOM: { label: 'Dệt theo yêu cầu', variant: 'warning' },
  OUT_OF_STOCK: { label: 'Hết hàng', variant: 'danger' },
  COMING_SOON: { label: 'Hàng sắp về', variant: 'purple' },
} satisfies Record<StockStatus, StatusConfig>;

/** Fallback khi status không match */
export const FALLBACK_STATUS_CONFIG: StatusConfig = {
  label: 'Không xác định',
  variant: 'gray',
};
