import type { StatusConfig } from '@/shared/components/status/status.tokens';

import { CONTRACT_STATUS_LABELS } from './contracts.module';
import type { ContractStatus } from './contracts.module';

export const contractStatus = {
  draft: {
    label: CONTRACT_STATUS_LABELS['draft'],
    variant: 'gray',
  },
  sent: {
    label: CONTRACT_STATUS_LABELS['sent'],
    variant: 'info',
  },
  signed: {
    label: CONTRACT_STATUS_LABELS['signed'],
    variant: 'success',
  },
  expired: {
    label: CONTRACT_STATUS_LABELS['expired'],
    variant: 'warning',
  },
  cancelled: {
    label: CONTRACT_STATUS_LABELS['cancelled'],
    variant: 'danger',
  },
} satisfies Record<ContractStatus, StatusConfig>;

export function parseContractStatus(
  status: unknown,
): ContractStatus | 'unknown' {
  if (typeof status === 'string' && status in contractStatus) {
    return status as ContractStatus;
  }
  return 'unknown';
}
