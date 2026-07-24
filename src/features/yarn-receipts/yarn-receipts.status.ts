import type { StatusConfig } from '@/shared/components/status/status.tokens';
import { DOC_STATUS_LABELS } from '@/schema/yarn-receipt.schema';
import type { DocStatus } from '@/schema/yarn-receipt.schema';

export const yarnReceiptStatus = {
  draft: {
    label: DOC_STATUS_LABELS.draft,
    variant: 'warning',
  },
  confirmed: {
    label: DOC_STATUS_LABELS.confirmed,
    variant: 'success',
  },
  cancelled: {
    label: DOC_STATUS_LABELS.cancelled,
    variant: 'danger',
  },
} satisfies Record<DocStatus, StatusConfig>;

export function parseYarnReceiptStatus(status: unknown): DocStatus | 'unknown' {
  if (typeof status === 'string' && status in yarnReceiptStatus) {
    return status as DocStatus;
  }
  return 'unknown';
}
