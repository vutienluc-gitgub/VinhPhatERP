import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import { Icon, type IconName } from './Icon';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gray'
  | 'purple';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: IconName;
}

/**
 * A standardized Badge component for status tags and labels.
 * Uses CSS classes from data-ui.css.
 */
export function Badge({
  children,
  variant = 'gray',
  className,
  icon,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'badge inline-flex items-center gap-1',
        `badge-${variant}`,
        className,
      )}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
