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
  /** (Premium) Hiển thị điểm sáng màu trạng thái, mặc định true nếu không có icon */
  showDot?: boolean;
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
  showDot,
}: BadgeProps) {
  // Nếu không chỉ định định dạng nào, tự động hiển thị chấm trạng thái đối với các Badge không có icon
  const renderDot = showDot ?? !icon;

  return (
    <span
      className={clsx(
        'badge inline-flex items-center gap-1.5',
        `badge-${variant}`,
        className,
      )}
    >
      {icon ? (
        <Icon name={icon} size={14} />
      ) : renderDot ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 shadow-[0_0_6px_currentColor]" />
      ) : null}
      {children}
    </span>
  );
}
