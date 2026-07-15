import { useState, useRef, useMemo } from 'react';
import { NavLink } from 'react-router-dom';

import { Icon } from '@/shared/components/Icon';
import { getNavigationItems } from '@/app/router/routes';
import { useAuth } from '@/features/auth/AuthProvider';
import { hasAccess } from '@/app/router/routes';
import { APP_SHELL_LABELS, QUICK_ACTIONS } from '@/shared/constants/layout';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

import { QuickCreateModal } from './QuickCreateModal';

export function AppLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeActionPath, setActiveActionPath] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();

  const navigationItems = getNavigationItems();
  const userRole = profile?.role;

  // Filter items based on access
  const accessibleItems = useMemo(() => {
    return navigationItems.filter((item) =>
      hasAccess(item.requiredRoles, userRole),
    );
  }, [navigationItems, userRole]);

  // Use accessible items
  const apps = accessibleItems;

  useClickOutside(containerRef, () => {
    if (isOpen) setIsOpen(false);
  });

  const handleQuickAction = (path: string) => {
    setIsOpen(false);
    setActiveActionPath(path);
  };

  return (
    <div className="app-launcher" ref={containerRef}>
      <button
        type="button"
        className="app-launcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={APP_SHELL_LABELS.APP_LAUNCHER_TITLE}
      >
        <Icon name="LayoutGrid" size={20} strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div className="app-launcher-popover">
          <div className="app-launcher-header">
            <span className="app-launcher-title">{APP_SHELL_LABELS.APPS}</span>
          </div>

          <div className="app-launcher-grid">
            {apps.map((app) => (
              <NavLink
                key={app.path}
                to={app.path}
                className="app-launcher-item"
                onClick={() => setIsOpen(false)}
              >
                <div className="app-launcher-icon">
                  <Icon name={app.icon || 'Box'} size={24} strokeWidth={1.5} />
                </div>
                <span className="app-launcher-label">{app.shortLabel}</span>
              </NavLink>
            ))}
          </div>

          <div className="app-launcher-divider" />

          <div className="app-launcher-header">
            <span className="app-launcher-title">
              {APP_SHELL_LABELS.QUICK_CREATE}
            </span>
          </div>

          <div className="app-launcher-quick-create">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                className="quick-create-btn"
                onClick={() => handleQuickAction(action.path)}
              >
                <div className="quick-create-icon-wrapper">
                  <Icon
                    name={action.icon}
                    size={20}
                    strokeWidth={1.5}
                    className="quick-create-icon"
                  />
                  <div className="quick-create-badge">
                    <Icon name="Plus" size={10} strokeWidth={3} />
                  </div>
                </div>
                <span className="quick-create-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <QuickCreateModal
        actionPath={activeActionPath}
        onClose={() => setActiveActionPath(null)}
      />
    </div>
  );
}
