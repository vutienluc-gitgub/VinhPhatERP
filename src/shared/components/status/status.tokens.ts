import type { IconName } from '@/shared/components/Icon';
import type { BadgeVariant } from '@/shared/components/Badge';

/**
 * Mọi trạng thái trong hệ thống (PO, WO, Contract,...) đều phải
 * map về một chuẩn StatusConfig duy nhất.
 */
export interface StatusConfig {
  /** Nhãn hiển thị cho trạng thái (vd: "Đã duyệt", "Đang xử lý") */
  label: string;
  /** Màu sắc Badge (success, danger, warning, info, gray...) */
  variant: BadgeVariant;
  /** Tên Icon (tùy chọn) hiển thị bên trong Badge hoặc khi dùng StatusIcon */
  icon?: IconName;
  /** Mô tả chi tiết (tùy chọn) dùng cho Tooltip hoặc StatusTimeline */
  description?: string;
}

export type { BadgeVariant };
