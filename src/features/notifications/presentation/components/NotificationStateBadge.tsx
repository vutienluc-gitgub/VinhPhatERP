import React from 'react';

import { Icon } from '@/shared/components';
import type { NotificationFsmState } from '@/features/notifications/domain/notification-fsm';
import { NotificationFsm } from '@/features/notifications/domain/notification-fsm';

interface Props {
  state: NotificationFsmState;
}

export const NotificationStateBadge: React.FC<Props> = ({ state }) => {
  const label = NotificationFsm.getStatusLabel(state);
  const variant = NotificationFsm.getStatusVariant(state);

  const variantStyles = {
    success: 'bg-success-soft text-success border-success/30',
    warning: 'bg-warning-soft text-warning border-warning/30',
    danger: 'bg-danger-soft text-danger border-danger/30',
    muted: 'bg-surface-secondary text-muted border-default',
  }[variant];

  const renderIcon = () => {
    switch (state) {
      case 'ACTIVE':
        return <Icon name="ShieldCheck" size={14} />;
      case 'DENIED':
      case 'FAILED':
        return <Icon name="AlertTriangle" size={14} />;
      case 'PERMISSION_REQUIRED':
        return <Icon name="BellOff" size={14} />;
      default:
        return <Icon name="BellRing" size={14} className="animate-pulse" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${variantStyles}`}
    >
      {renderIcon()}
      {label}
    </span>
  );
};
