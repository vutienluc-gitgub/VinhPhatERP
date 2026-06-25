import type { BadgeVariant } from '@/shared/components';

/** Trạng thái mẫu vải */
export type SampleStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'PREPARING';

/** Trạng thái tồn kho */
export type StockStatus = 'READY' | 'CUSTOM' | 'OUT_OF_STOCK' | 'COMING_SOON';

/** Cấu hình hiển thị cho một trạng thái */
export type StatusConfig = {
  label: string;
  variant: BadgeVariant;
};

/** Generic props — status bị ràng buộc với keys của configMap */
export type StatusBadgeProps<T extends string> = {
  status: T | null | undefined;
  configMap: Record<T, StatusConfig>;
  className?: string;
};
