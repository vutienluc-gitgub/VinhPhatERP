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
    <nav className="mobile-nav" aria-label="Bottom navigation" role="tablist">
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
              `mobile-nav-link${isActive ? ' active' : ''}`
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
                {/* Active indicator — 2px bar on top */}
                {isActive && (
                  <span
                    className="mobile-nav-active-indicator"
                    aria-hidden="true"
                  />
                )}
                <span className="mobile-nav-icon-wrapper">
                  <Icon
                    name={iconName}
                    size={24}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {hasBadge && (
                    <span
                      className="mobile-nav-badge"
                      aria-label={`${APP_SHELL_LABELS.NOTIFICATION_PREFIX} ${badgeText}`}
                    >
                      {badgeText}
                    </span>
                  )}
                  {item.hasDot && !hasBadge && (
                    <span className="mobile-nav-dot" aria-hidden="true" />
                  )}
                </span>
                <span className="mobile-nav-label">{item.shortLabel}</span>
              </>
            )}
          </NavLink>
        );
      })}
      <button
        type="button"
        role="tab"
        aria-selected={isDrawerActive}
        className={`mobile-nav-link mobile-menu-btn${isDrawerActive ? ' active' : ''}`}
        onClick={handleMenuClick}
        aria-label={
          menuBadge
            ? `${APP_SHELL_LABELS.MENU}, ${menuBadge} ${APP_SHELL_LABELS.TASKS_PENDING_SUFFIX}`
            : APP_SHELL_LABELS.MENU
        }
      >
        {isDrawerActive && (
          <span className="mobile-nav-active-indicator" aria-hidden="true" />
        )}
        <span className="mobile-nav-icon-wrapper">
          <Icon
            name="LayoutGrid"
            size={24}
            strokeWidth={isDrawerActive ? 2 : 1.5}
          />
          {menuBadge !== undefined &&
            menuBadge !== null &&
            menuBadge !== 0 &&
            menuBadge !== '' && (
              <span
                className="mobile-nav-badge"
                aria-label={`${APP_SHELL_LABELS.NOTIFICATION_PREFIX} ${menuBadge}`}
              >
                {typeof menuBadge === 'number' && menuBadge > 99
                  ? '99+'
                  : menuBadge}
              </span>
            )}
          {menuHasDot && !menuBadge && (
            <span className="mobile-nav-dot" aria-hidden="true" />
          )}
        </span>
        <span className="mobile-nav-label">{APP_SHELL_LABELS.MENU}</span>
      </button>
    </nav>
  );
});
