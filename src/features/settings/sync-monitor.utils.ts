import type { SyncJobRow, SyncStats } from '@/api/sync.api';
import { SYNC_MONITOR_LABELS } from '@/features/settings/sync-monitor.constants';

export function getJobEntityLabel(entityType: string): string {
  if (entityType === 'shipment') return SYNC_MONITOR_LABELS.ENTITY_SHIPMENT;
  if (entityType === 'order') return SYNC_MONITOR_LABELS.ENTITY_ORDER;
  return entityType;
}

export function getJobCode(job: SyncJobRow): string {
  const payload = job.payload;
  if (payload) {
    if (typeof payload.shipmentNumber === 'string')
      return payload.shipmentNumber;
    if (typeof payload.orderNumber === 'string') return payload.orderNumber;
  }
  return job.entity_id.slice(0, 8);
}

export function formatDateTime(isoString: string | null): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString(
    'vi-VN',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
  )}`;
}

export function calculateTotalFailed(stats?: SyncStats | null): number {
  if (!stats) return 0;
  return (stats.failed ?? 0) + (stats.deadLetter ?? 0);
}
