import React from 'react';
import { NavLink } from 'react-router-dom';

import type { NavigationItem } from '@/app/router/routes';
import { Icon } from '@/shared/components/Icon';
import { APP_SHELL_LABELS } from '@/shared/constants/layout';

interface MobileBottomNavProps {
  bottomTabs: NavigationItem[];
  isDrawerActive: boolean;
  onOpenMore: () => void;
}

export const MobileBottomNav = React.memo(function MobileBottomNav({
  bottomTabs,
  isDrawerActive,
  onOpenMore,
}: MobileBottomNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Bottom navigation" role="tablist">
      {bottomTabs.map((item) => {
        const iconName =
          item.icon ?? (item.path === '/' ? 'Home' : 'Component');
        return (
          <NavLink
            key={item.path}
            to={item.path}
            role="tab"
            aria-selected={undefined}
            className={({ isActive }) =>
              `mobile-nav-link${isActive ? ' active' : ''}`
            }
            end={item.path === '/'}
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
                <Icon
                  name={iconName}
                  size={24}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span>{item.shortLabel}</span>
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
        onClick={onOpenMore}
        aria-label={APP_SHELL_LABELS.MENU}
      >
        {isDrawerActive && (
          <span className="mobile-nav-active-indicator" aria-hidden="true" />
        )}
        <Icon
          name="LayoutGrid"
          size={24}
          strokeWidth={isDrawerActive ? 2 : 1.5}
        />
        <span>{APP_SHELL_LABELS.MENU}</span>
      </button>
    </nav>
  );
});
