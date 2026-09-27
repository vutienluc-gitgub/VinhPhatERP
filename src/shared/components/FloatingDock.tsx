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

export type FloatingDockSource = DockSourceItem;

interface FloatingDockProps {
  /** Danh sách tab (thường là bottomTabs đã resolve theo role). */
  items: FloatingDockSource[];
  /** Tab đang hoạt động theo `id` (chính là `path`). */
  activeId?: string;
  onSelect: (id: string) => void;
  /** Nút phụ cuối dock — dùng cho "Menu". */
  action?: FloatingDockAction;
  className?: string;
}

interface DockButtonProps {
  item: FloatingDockItem;
  isActive: boolean;
  onClick: () => void;
}

const DockButton = memo(function DockButton({
  item,
  isActive,
  onClick,
}: DockButtonProps) {
  const badgeText = formatDockBadge(item.badge);
  const showDot = !!item.hasDot && !badgeText;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-current={isActive ? 'page' : undefined}
      className={`${styles.tab}${isActive ? ` ${styles.isActive}` : ''}`}
      onClick={onClick}
      aria-label={
        badgeText
          ? `${item.label}, ${badgeText} ${APP_SHELL_LABELS.TASKS_PENDING_SUFFIX}`
          : item.label
      }
    >
      <span className={styles.iconWrap}>
        <Icon
          name={item.icon}
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
      </span>
      <span className={styles.label}>{item.label}</span>
    </button>
  );
});

const DockAction = memo(function DockAction({
  action,
}: {
  action: FloatingDockAction;
}) {
  const badgeText = formatDockBadge(action.badge);
  const showDot = !!action.hasDot && !badgeText;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={action.isActive}
      aria-haspopup="dialog"
      aria-expanded={action.isActive}
      className={`${styles.tab}${action.isActive ? ` ${styles.isActive}` : ''}`}
      onClick={action.onTrigger}
      aria-label={action.ariaLabel}
    >
      <span className={styles.iconWrap}>
        <Icon
          name={action.icon}
          size={24}
          strokeWidth={action.isActive ? 2.4 : 1.7}
          aria-hidden="true"
        />
        {badgeText && (
          <span className={styles.badge} aria-hidden="true">
            {badgeText}
          </span>
        )}
        {showDot && <span className={styles.dot} aria-hidden="true" />}
      </span>
      <span className={styles.label}>{action.label}</span>
    </button>
  );
});

export const FloatingDock = memo(function FloatingDock({
  items,
  activeId,
  onSelect,
  action,
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
          <DockButton
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onClick={handleSelect(item.id)}
          />
        ))}

        {action && <DockAction action={action} />}
      </div>
    </nav>
  );
});

export type { FloatingDockAction, FloatingDockItem };
