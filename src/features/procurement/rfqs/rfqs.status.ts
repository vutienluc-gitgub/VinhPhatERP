import type { StatusConfig } from '@/shared/components/status/status.tokens';

import { RFQ_LABELS } from './rfqs.constants';

export const rfqQuoteStatus = {
  awarded: {
    label: RFQ_LABELS.BADGE_AWARDED,
    variant: 'success',
  },
  rejected: {
    label: RFQ_LABELS.BADGE_REJECTED,
    variant: 'danger',
  },
  pending: {
    label: RFQ_LABELS.BADGE_PENDING,
    variant: 'warning',
  },
} satisfies Record<string, StatusConfig>;

export function parseRFQQuoteStatus(status: unknown): string | 'unknown' {
  if (typeof status === 'string' && status in rfqQuoteStatus) {
    return status;
  }
  return 'unknown';
}
