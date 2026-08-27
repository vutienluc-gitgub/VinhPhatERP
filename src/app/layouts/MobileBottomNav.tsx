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
    <nav className="mobile-nav" aria-label="Bottom navigation">
      {bottomTabs.map((item) => {
        const iconName =
          item.icon ?? (item.path === '/' ? 'Home' : 'Component');
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `mobile-nav-link${isActive ? ' text-foreground bg-primary/10' : ''}`
            }
            end={item.path === '/'}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={iconName}
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.6}
                />
                <span>{item.shortLabel}</span>
              </>
            )}
          </NavLink>
        );
      })}
      <button
        type="button"
        className={`mobile-nav-link mobile-menu-btn${isDrawerActive ? ' text-foreground bg-primary/10' : ''}`}
        onClick={onOpenMore}
        aria-label="Menu"
      >
        <Icon
          name="LayoutGrid"
          size={22}
          strokeWidth={isDrawerActive ? 2.2 : 1.6}
        />
        <span>{APP_SHELL_LABELS.MENU}</span>
      </button>
    </nav>
  );
});
