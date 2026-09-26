import React, { useCallback } from 'react';
import { NavLink } from 'react-router-dom';

import type { NavigationItem } from '@/app/router/routes';
import { Icon } from '@/shared/components/Icon';
import { APP_SHELL_LABELS } from '@/shared/constants/layout';
import { HAPTIC_PATTERNS, triggerHapticFeedback } from '@/shared/lib/haptics';

export interface BottomTabItem extends NavigationItem {
  badge?: number | string;
  hasDot?: boolean;
}

interface MobileBottomNavProps {
  bottomTabs: BottomTabItem[];
  isDrawerActive: boolean;
  onOpenMore: () => void;
  menuBadge?: number | string;
  menuHasDot?: boolean;
}

export const MobileBottomNav = React.memo(function MobileBottomNav({
  bottomTabs,
  isDrawerActive,
  onOpenMore,
  menuBadge,
  menuHasDot,
}: MobileBottomNavProps) {
  const handleTabClick = useCallback(() => {
    triggerHapticFeedback(HAPTIC_PATTERNS.SELECTION);
  }, []);

  const handleMenuClick = useCallback(() => {
    triggerHapticFeedback(HAPTIC_PATTERNS.SELECTION);
    onOpenMore();
  }, [onOpenMore]);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden flex items-center justify-around px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-surface/95 backdrop-blur-md border-t border-border shadow-lg"
      aria-label="Bottom navigation"
      role="tablist"
    >
      {bottomTabs.map((item) => {
        const iconName =
          item.icon ?? (item.path === '/' ? 'Home' : 'Component');
        const hasBadge =
          item.badge !== undefined &&
          item.badge !== null &&
          item.badge !== 0 &&
          item.badge !== '';
        const badgeText =
          typeof item.badge === 'number' && item.badge > 99
            ? '99+'
            : String(item.badge ?? '');

        return (
          <NavLink
            key={item.path}
            to={item.path}
            role="tab"
            aria-selected={undefined}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center justify-center min-w-0 py-1.5 px-1.5 rounded-xl active:scale-95 transition-all text-xs ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              }`
            }
            onClick={handleTabClick}
            end={item.path === '/'}
            aria-label={
              hasBadge
                ? `${item.label}, ${badgeText} ${APP_SHELL_LABELS.TASKS_PENDING_SUFFIX}`
                : item.label
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar — pinned to top border of nav */}
                {isActive && (
                  <span
                    className="mobile-nav-active-indicator absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <span className="relative inline-flex items-center justify-center">
                  <Icon
                    name={iconName}
                    size={24}
                    strokeWidth={isActive ? 2.4 : 1.7}
                  />
                  {hasBadge && (
                    <span
                      className="mobile-nav-badge absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-danger text-inverse-foreground text-[10px] font-bold leading-4 text-center whitespace-nowrap pointer-events-none tabular-nums shadow-[0_0_0_1.5px_var(--surface-strong)]"
                      aria-label={`${APP_SHELL_LABELS.NOTIFICATION_PREFIX} ${badgeText}`}
                    >
                      {badgeText}
                    </span>
                  )}
                  {item.hasDot && !hasBadge && (
                    <span
                      className="mobile-nav-dot absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-danger pointer-events-none shadow-[0_0_0_1.5px_var(--surface-strong)]"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="truncate max-w-full text-[11px] leading-tight mt-1 select-none">
                  {item.shortLabel}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
      <button
        type="button"
        role="tab"
        aria-selected={isDrawerActive}
        aria-haspopup="dialog"
        aria-expanded={isDrawerActive}
        className={`relative flex flex-1 flex-col items-center justify-center min-w-0 py-1.5 px-1.5 rounded-xl active:scale-95 transition-all text-xs ${
          isDrawerActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground font-medium'
        }`}
        onClick={handleMenuClick}
        aria-label={
          menuBadge
            ? `${APP_SHELL_LABELS.MENU}, ${menuBadge} ${APP_SHELL_LABELS.TASKS_PENDING_SUFFIX}`
            : APP_SHELL_LABELS.MENU
        }
      >
        {isDrawerActive && (
          <span
            className="mobile-nav-active-indicator absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
            aria-hidden="true"
          />
        )}
        <span className="relative inline-flex items-center justify-center">
          <Icon
            name="LayoutGrid"
            size={24}
            strokeWidth={isDrawerActive ? 2.4 : 1.7}
          />
          {menuBadge !== undefined &&
            menuBadge !== null &&
            menuBadge !== 0 &&
            menuBadge !== '' && (
              <span
                className="mobile-nav-badge absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-danger text-inverse-foreground text-[10px] font-bold leading-4 text-center whitespace-nowrap pointer-events-none tabular-nums shadow-[0_0_0_1.5px_var(--surface-strong)]"
                aria-label={`${APP_SHELL_LABELS.NOTIFICATION_PREFIX} ${menuBadge}`}
              >
                {typeof menuBadge === 'number' && menuBadge > 99
                  ? '99+'
                  : menuBadge}
              </span>
            )}
          {menuHasDot && !menuBadge && (
            <span
              className="mobile-nav-dot absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-danger pointer-events-none shadow-[0_0_0_1.5px_var(--surface-strong)]"
              aria-hidden="true"
            />
          )}
        </span>
        <span className="truncate max-w-full text-[11px] leading-tight mt-1 select-none">
          {APP_SHELL_LABELS.MENU}
        </span>
      </button>
    </nav>
  );
});
