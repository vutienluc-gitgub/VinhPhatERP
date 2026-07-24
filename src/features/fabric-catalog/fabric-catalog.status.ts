import type { StatusConfig } from '@/shared/components/status/status.tokens';

export const fabricSampleStatus = {
  AVAILABLE: { label: 'Có sẵn mẫu', variant: 'success' },
  OUT_OF_STOCK: { label: 'Tạm hết mẫu', variant: 'danger' },
  PREPARING: { label: 'Đang chuẩn bị mẫu', variant: 'warning' },
} satisfies Record<string, StatusConfig>;

export const fabricStockStatus = {
  READY: { label: 'Có sẵn hàng', variant: 'info' },
  CUSTOM: { label: 'Dệt theo yêu cầu', variant: 'warning' },
  OUT_OF_STOCK: { label: 'Hết hàng', variant: 'danger' },
  COMING_SOON: { label: 'Hàng sắp về', variant: 'purple' },
} satisfies Record<string, StatusConfig>;
