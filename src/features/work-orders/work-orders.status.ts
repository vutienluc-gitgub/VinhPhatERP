import type { StatusConfig } from '@/shared/components/status/status.tokens';
import type { WorkOrderStatus } from '@/domain/production/work-orders.types';

export const workOrderStatus = {
  draft: {
    label: 'Nháp',
    variant: 'gray',
  },
  in_progress: {
    label: 'Đang sản xuất',
    variant: 'warning',
  },
  pending_verification: {
    label: 'Chờ QC xác nhận',
    variant: 'warning',
  },
  completed: {
    label: 'Hoàn thành',
    variant: 'success',
  },
  cancelled: {
    label: 'Đã hủy',
    variant: 'danger',
  },
  yarn_issued: {
    label: 'Đã xuất sợi',
    variant: 'info',
  },
} satisfies Record<WorkOrderStatus, StatusConfig>;

export function parseWorkOrderStatus(
  status: unknown,
): WorkOrderStatus | 'unknown' {
  if (typeof status === 'string' && status in workOrderStatus) {
    return status as WorkOrderStatus;
  }
  return 'unknown';
}
