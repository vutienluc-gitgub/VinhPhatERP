import { memo } from 'react';
import { Link } from 'react-router-dom';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Button } from './Button';

type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: IconName;
  actionHref?: string;
  actionClick?: () => void;
  icon?: IconName;
};

export const EmptyState = memo(function EmptyState({
  title = 'Chưa có dữ liệu',
  description,
  actionLabel,
  actionIcon,
  actionHref,
  actionClick,
  icon = 'inbox',
}: EmptyStateProps) {
  return (
    <div className="py-12 px-6 flex flex-col items-center justify-center text-center bg-[var(--surface)] rounded-[var(--radius-sm)]">
      <div className="mb-4 opacity-70 flex justify-center">
        <Icon name={icon as IconName} size={48} strokeWidth={1} />
      </div>
      <h3 className="m-0 mb-2 font-bold text-foreground text-lg">{title}</h3>
      {description && (
        <p className="text-muted text-sm mb-6 max-w-[400px] text-center">
          {description}
        </p>
      )}

      {actionLabel &&
        (actionHref ? (
          <Button variant="primary" asChild leftIcon={actionIcon}>
            <Link to={actionHref}>{actionLabel}</Link>
          </Button>
        ) : actionClick ? (
          <Button variant="primary" onClick={actionClick} leftIcon={actionIcon}>
            {actionLabel}
          </Button>
        ) : null)}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
