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
  icon?: IconName | string;
};

export const EmptyState = memo(function EmptyState({
  title = 'Chưa có dữ liệu',
  description,
  actionLabel,
  actionIcon,
  actionHref,
  actionClick,
  icon = '📂',
}: EmptyStateProps) {
  // Biểu thức regex đơn giản nhận diện tên Icon của Lucide (PascalCase)
  const isLucideIcon =
    typeof icon === 'string' && /^[A-Z][a-zA-Z]+$/.test(icon);

  return (
    <div className="py-12 px-6 text-center bg-[var(--surface)] rounded-[var(--radius-sm)]">
      <div className="text-5xl mb-3 opacity-90 flex justify-center">
        {isLucideIcon ? <Icon name={icon as IconName} size={48} /> : icon}
      </div>
      <h3 className="m-0 mb-2 font-bold text-text">{title}</h3>
      {description && (
        <p className="text-muted text-[0.92rem] mb-6 max-w-[400px] mx-auto">
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
