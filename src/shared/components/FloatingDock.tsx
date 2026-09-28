import { memo, useCallback } from 'react';

import { APP_SHELL_LABELS } from '@/shared/constants/layout';
import { Icon } from '@/shared/components/Icon';
import {
  formatDockBadge,
  toDockItems,
} from '@/shared/lib/navigation/floating-dock.utils';
import type {
  FloatingDockItem,
  FloatingDockProps,
} from '@/shared/lib/navigation/floating-dock.types';

import styles from './FloatingDock.module.css';

interface DockIconButtonProps {
  icon: FloatingDockItem['icon'];
  /** Nhãn trợ năng đầy đủ cho aria-label. */
  ariaLabel: string;
  badge?: number | string;
  hasDot?: boolean;
  isActive?: boolean;
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
  onClick,
  isDialogTrigger,
}: DockIconButtonProps) {
  const badgeText = formatDockBadge(badge);
  const showDot = !!hasDot && !badgeText;

  const classes = [styles.tab];
  if (isActive) classes.push(styles.isActive);

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
  fab,
  className,
}: FloatingDockProps) {
  const dockItems = toDockItems(items);

  const handleSelect = useCallback(
    (id: string) => () => onSelect(id),
    [onSelect],
  );

  if (dockItems.length === 0) return null;

  return (
    <>
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
              isDialogTrigger
              onClick={action.onTrigger}
            />
          ))}
        </div>
      </nav>

      {/* FAB nổi tách riêng — nằm ngoài pill, neo góc phải dưới */}
      {fab && (
        <button
          type="button"
          className={styles.fab}
          onClick={fab.onTrigger}
          aria-label={fab.ariaLabel ?? fab.label}
          aria-haspopup="dialog"
        >
          <Icon
            name={fab.icon}
            size={26}
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </button>
      )}
    </>
  );
});
