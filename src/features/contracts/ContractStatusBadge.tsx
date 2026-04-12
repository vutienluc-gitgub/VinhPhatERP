import { Badge, type BadgeVariant } from '@/shared/components';

import { CONTRACT_STATUS_LABELS } from './contracts.module';
import type { ContractStatus } from './contracts.module';

function getVariant(status: ContractStatus): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'sent':
      return 'info';
    case 'signed':
      return 'success';
    case 'expired':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'gray';
  }
}

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  return (
    <Badge variant={getVariant(status)}>{CONTRACT_STATUS_LABELS[status]}</Badge>
  );
}
