import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { useDashboardStats } from '@/features/dashboard/useDashboardData';
import { navigationItems } from '@/app/router/routes';
import type { NavigationItem } from '@/app/router/routes';
import type { UserRole } from '@/services/supabase/database.types';
import { useTheme } from '@/shared/hooks/useTheme';
import { Icon } from '@/shared/components/Icon';

import { MobileMoreDrawer } from './MobileMoreDrawer';

function getCurrentItem(pathname: string) {
  return navigationItems.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );
}

function hasAccess(
  requiredRoles: UserRole[] | undefined,
  role: UserRole | undefined,
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return role !== undefined && requiredRoles.includes(role);
}

const roleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  driver: 'Tai xe',
  viewer: 'Viewer',
  sale: 'Sale',
};

/** Group display metadata */
const GROUP_LABELS: Record<string, { label: string; icon: string }> = {
  sales: {
    label: 'Kinh doanh',
    icon: 'Briefcase',
  },
  production: {
    label: 'San xuat',
    icon: 'Factory',
  },
  'master-data': {
    label: 'Danh muc',
    icon: 'Database',
  },
  system: {
    label: 'He thong',
    icon: 'Shield',
  },
};

const GROUP_ORDER = ['sales', 'production', 'master-data', 'system'];

const STORAGE_KEY = 'erp-sidebar-collapsed';

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    /* ignore */
  }
  return {};
}

function saveCollapsed(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

type GroupedNav = {
  group: string;
  label: string;
  icon: string;
  items: NavigationItem[];
};

export function AppShell() {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [collapsed, setCollapsed] =
    useState<Record<string, boolean>>(loadCollapsed);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentItem = getCurrentItem(pathname);
  const { data: stats } = useDashboardStats();
  const { theme, toggleTheme } = useTheme();

  const userRole = profile?.role;
  const visibleNavItems = navigationItems.filter((item) =>
    hasAccess(item.requiredRoles, userRole),
  );
  const primaryItems = visibleNavItems.filter((item) => item.primaryMobile);
  const secondaryItems = visibleNavItems.filter((item) => !item.primaryMobile);
  const isSecondaryActive = secondaryItems.some((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );

  // Dashboard item (no group)
  const dashboardItem = visibleNavItems.find((item) => item.path === '/');

  // Group remaining items
  const grouped: GroupedNav[] = useMemo(() => {
    const itemsWithGroup = visibleNavItems.filter(
      (item) => item.path !== '/' && item.group,
    );
    return GROUP_ORDER.map((groupKey) => {
      const meta = GROUP_LABELS[groupKey];
      if (!meta) return null;
      const items = itemsWithGroup.filter((item) => item.group === groupKey);
      if (items.length === 0) return null;
      return {
        group: groupKey,
        label: meta.label,
        icon: meta.icon,
        items,
      };
    }).filter((g): g is GroupedNav => g !== null);
  }, [visibleNavItems]);

  const toggleGroup = useCallback((group: string) => {
    setCollapsed((prev) => {
      const next = {
        ...prev,
        [group]: !prev[group],
      };
      saveCollapsed(next);
      return next;
    });
  }, []);

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  function renderNavLink(item: NavigationItem) {
    const iconName = item.icon ?? 'Component';
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
        end={item.path === '/'}
      >
        <div className="nav-link-inner">
          <span className="nav-icon" aria-hidden="true">
            <Icon name={iconName} size={18} strokeWidth={1.5} />
          </span>
          <span className="nav-link-title">{item.label}</span>
        </div>
        {item.path === '/orders' && stats?.overdueOrders ? (
          <span className="nav-badge danger">{stats.overdueOrders}</span>
        ) : item.path === '/quotations' && stats?.expiringQuotations ? (
          <span className="nav-badge warning">{stats.expiringQuotations}</span>
        ) : null}
      </NavLink>
    );
  }

  return (
    <div className="shell-layout">
      <aside className="sidebar-nav">
        <div className="brand-block">
          <p className="eyebrow">Vinh Phat</p>
          <h1>ERP San xuat</h1>
        </div>

        <nav className="nav-stack" aria-label="Main navigation">
          {/* Dashboard - always visible at top */}
          {dashboardItem && renderNavLink(dashboardItem)}

          {/* Grouped navigation */}
          {grouped.map((g) => {
            const isCollapsed = collapsed[g.group] ?? false;
            const hasActive = g.items.some((item) =>
              pathname.startsWith(item.path),
            );
            return (
              <div key={g.group} className="nav-group">
                <button
                  type="button"
                  className={`nav-group-toggle${hasActive ? ' has-active' : ''}`}
                  onClick={() => toggleGroup(g.group)}
                  aria-expanded={!isCollapsed}
                >
                  <span className="nav-group-label">{g.label}</span>
                  <Icon
                    name="ChevronDown"
                    size={14}
                    strokeWidth={2}
                    className={`nav-group-chevron${isCollapsed ? ' is-collapsed' : ''}`}
                  />
                </button>
                <div
                  className={`nav-group-items${isCollapsed ? ' is-collapsed' : ''}`}
                >
                  {g.items.map(renderNavLink)}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentItem?.shortLabel ?? 'MVP V2'}</p>
            <h2>{currentItem?.label ?? 'Dashboard'}</h2>
          </div>
          <div
            className="topbar-actions"
            ref={userMenuRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
              aria-label="Toggle Theme"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                fontSize: '1.15rem',
                color: 'var(--text)',
                padding: 0,
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {profile && (
              <button
                type="button"
                className="user-trigger"
                onClick={() => setShowUserMenu((v) => !v)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <span className="user-avatar">{initials}</span>
                <span className="user-name">
                  {profile.full_name || profile.id.slice(0, 8)}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {showUserMenu && profile && (
              <div className="user-dropdown" role="menu">
                <div className="user-dropdown-header">
                  <span className="user-dropdown-name">
                    {profile.full_name || profile.id}
                  </span>
                  <span className="status-pill">
                    {roleLabel[profile.role] ?? profile.role}
                  </span>
                </div>
                <div className="user-dropdown-divider" />
                <button
                  type="button"
                  className="user-dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2H6M10.667 11.333L14 8m0 0l-3.333-3.333M14 8H6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="route-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Bottom navigation">
        {primaryItems.slice(0, 5).map((item) => {
          const iconName =
            item.icon ?? (item.path === '/' ? 'Home' : 'Component');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mobile-nav-link${isActive ? ' is-active' : ''}`
              }
              end={item.path === '/'}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={iconName}
                    size={24}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    fill={isActive ? 'currentColor' : 'none'}
                    fillOpacity={isActive ? 0.15 : 0}
                  />
                  <span>{item.shortLabel}</span>
                </>
              )}
            </NavLink>
          );
        })}
        <button
          type="button"
          className={`mobile-more-btn${isSecondaryActive ? ' is-active' : ''}`}
          onClick={() => setShowMore(true)}
          aria-label="Menu"
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
            }}
          >
            <span
              className="user-avatar"
              style={{
                width: 26,
                height: 26,
                fontSize: '0.65rem',
              }}
            >
              {initials}
            </span>
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -4,
                background: 'var(--surface-strong)',
                borderRadius: '50%',
                padding: '1px',
              }}
            >
              <div
                style={{
                  background: 'var(--muted)',
                  borderRadius: '50%',
                  width: 12,
                  height: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name="AlignJustify"
                  className="hamburger-badge"
                  size={8}
                  color="#fff"
                  strokeWidth={3}
                />
              </div>
            </div>
          </div>
          <span>Menu</span>
        </button>
      </nav>

      {showMore && (
        <MobileMoreDrawer
          items={secondaryItems}
          onClose={() => setShowMore(false)}
        />
      )}
    </div>
  );
}
