import { memo, useCallback } from 'react';

import { APP_SHELL_LABELS } from '@/shared/constants/layout';
import { Icon } from '@/shared/components/Icon';
import {
  formatDockBadge,
  type DockSourceItem,
  toDockItems,
} from '@/shared/lib/navigation/floating-dock.utils';
import type {
  FloatingDockAction,
  FloatingDockItem,
} from '@/shared/lib/navigation/floating-dock.types';

import styles from './FloatingDock.module.css';

interface FloatingDockProps {
  /** Danh sách tab (thường là bottomTabs đã resolve theo role). */
  items: DockSourceItem[];
  /** Tab đang hoạt động theo `id` (chính là `path`). */
  activeId?: string;
  onSelect: (id: string) => void;
  /** Nút hành động hiển thị sau các tab, theo thứ tự truyền vào. */
  actions?: FloatingDockAction[];
  className?: string;
}

interface DockIconButtonProps {
  icon: FloatingDockItem['icon'];
  /** Nhãn trợ năng đầy đủ cho aria-label. */
  ariaLabel: string;
  badge?: number | string;
  hasDot?: boolean;
  isActive?: boolean;
  isPrimary?: boolean;
  onClick: () => void;
  /** Nút Menu mở drawer dạng dialog. */
  isDialogTrigger?: boolean;
}

/**
 * Một ô trong dock. Dock hiển thị icon-only nên nhãn chữ chỉ dùng cho
 * aria-label, không render ra giao diện.
 */
const DockIconButton = memo(function DockIconButton({
  icon,
  ariaLabel,
  badge,
  hasDot,
  isActive,
  isPrimary,
  onClick,
  isDialogTrigger,
}: DockIconButtonProps) {
  const badgeText = formatDockBadge(badge);
  const showDot = !!hasDot && !badgeText;

  const classes = [styles.tab];
  if (isActive) classes.push(styles.isActive);
  if (isPrimary) classes.push(styles.isPrimary);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-current={isActive ? 'page' : undefined}
      aria-haspopup={isDialogTrigger ? 'dialog' : undefined}
      aria-expanded={isDialogTrigger ? isActive : undefined}
      className={classes.join(' ')}
      onClick={onClick}
      aria-label={
        badgeText
          ? `${ariaLabel}, ${badgeText} ${APP_SHELL_LABELS.TASKS_PENDING_SUFFIX}`
          : ariaLabel
      }
    >
      <Icon
        name={icon}
        size={24}
        strokeWidth={isActive ? 2.4 : 1.7}
        aria-hidden="true"
      />
      {badgeText && (
        <span className={styles.badge} aria-hidden="true">
          {badgeText}
        </span>
      )}
      {showDot && <span className={styles.dot} aria-hidden="true" />}
    </button>
  );
});

export const FloatingDock = memo(function FloatingDock({
  items,
  activeId,
  onSelect,
  actions,
  className,
}: FloatingDockProps) {
  const dockItems = toDockItems(items);

  const handleSelect = useCallback(
    (id: string) => () => onSelect(id),
    [onSelect],
  );

  if (dockItems.length === 0) return null;

  return (
    <nav
      className={`${styles.dock}${className ? ` ${className}` : ''}`}
      aria-label={APP_SHELL_LABELS.DOCK_NAV_ARIA}
      role="tablist"
    >
      <div className={styles.surface}>
        {dockItems.map((item) => (
          <DockIconButton
            key={item.id}
            icon={item.icon}
            ariaLabel={item.label}
            badge={item.badge}
            hasDot={item.hasDot}
            isActive={activeId === item.id}
            onClick={handleSelect(item.id)}
          />
        ))}

        {actions?.map((action) => (
          <DockIconButton
            key={action.label}
            icon={action.icon}
            ariaLabel={action.ariaLabel ?? action.label}
            badge={action.badge}
            hasDot={action.hasDot}
            isActive={action.isActive}
            isPrimary={action.variant === 'primary'}
            isDialogTrigger
            onClick={action.onTrigger}
          />
        ))}
      </div>
    </nav>
  );
});
