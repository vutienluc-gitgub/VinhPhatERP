import type { StatusConfig } from '@/shared/components/status/status.tokens';

import { PO_CONSTANTS } from './purchase-orders.constants';

export const purchaseOrderStatus = {
  draft: {
    label: PO_CONSTANTS.STATUS_DRAFT,
    variant: 'gray',
    description: 'PO nháp, chưa trình duyệt.',
  },
  approved: {
    label: PO_CONSTANTS.STATUS_APPROVED,
    variant: 'info',
    description: 'PO đã được duyệt.',
  },
  partial_received: {
    label: PO_CONSTANTS.STATUS_PARTIAL,
    variant: 'warning',
    description: 'Đã nhận một phần hàng hóa.',
  },
  completed: {
    label: PO_CONSTANTS.STATUS_COMPLETED,
    variant: 'success',
    description: 'Đã hoàn thành toàn bộ PO.',
  },
  rejected: {
    label: PO_CONSTANTS.STATUS_REJECTED,
    variant: 'danger',
    description: 'PO bị từ chối.',
  },
  cancelled: {
    label: PO_CONSTANTS.STATUS_CANCELLED,
    variant: 'danger',
    description: 'PO đã hủy.',
  },
} satisfies Record<string, StatusConfig>;

export type POStatus = keyof typeof purchaseOrderStatus;

/** Boundary validation function for API data */
export function parsePOStatus(status: unknown): POStatus | 'unknown' {
  if (typeof status === 'string' && status in purchaseOrderStatus) {
    return status as POStatus;
  }
  return 'unknown';
}
