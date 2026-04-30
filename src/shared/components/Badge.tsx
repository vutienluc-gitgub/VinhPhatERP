import { clsx } from 'clsx';
import { memo } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

import { Icon, type IconName } from './Icon';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gray'
  | 'purple';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: IconName;
  iconSize?: number;
  /** (Premium) Hiển thị điểm sáng màu trạng thái */
  showDot?: boolean;
}

/**
 * A standardized Badge component for status tags and labels.
 * Uses CSS classes from data-ui.css.
 */
export const Badge = memo(function Badge({
  children,
  variant = 'gray',
  className,
  icon,
  iconSize = 14,
  showDot = false,
  ...rest
}: BadgeProps) {
  // Điểm sáng trạng thái nay được thiết lập minh bạch qua prop showDot
  const renderDot = showDot;

  return (
    <span
      className={clsx(
        'badge inline-flex items-center gap-1.5',
        `badge-${variant}`,
        className,
      )}
      {...rest}
    >
      {icon ? (
        <Icon name={icon} size={iconSize} />
      ) : renderDot ? (
        <span className="badge-dot" />
      ) : null}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
