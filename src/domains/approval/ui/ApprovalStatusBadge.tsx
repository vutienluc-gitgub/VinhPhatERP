import { clsx } from 'clsx';

import {
  ApprovalStatus,
  APPROVAL_STATUS,
  APPROVAL_STATUS_VI,
} from '@/domains/approval/models/constants';

interface Props {
  status: ApprovalStatus;
  className?: string;
}

export function ApprovalStatusBadge({ status, className }: Props) {
  const getBadgeStyle = () => {
    switch (status) {
      case APPROVAL_STATUS.DRAFT:
        return 'bg-surface-secondary text-muted border-default';
      case APPROVAL_STATUS.PENDING:
        return 'bg-warning-soft text-warning border-warning/20';
      case APPROVAL_STATUS.APPROVED:
        return 'bg-success-soft text-success border-success/20';
      case APPROVAL_STATUS.REJECTED:
        return 'bg-danger-soft text-danger border-danger/20';
      case APPROVAL_STATUS.CANCELLED:
        return 'bg-surface-secondary text-muted border-default line-through';
      default:
        return 'bg-surface-secondary text-muted border-default';
    }
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        getBadgeStyle(),
        className,
      )}
    >
      {APPROVAL_STATUS_VI[status]}
    </span>
  );
}
