import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { useDashboardStats } from '@/features/dashboard/useDashboardData';
import { navigationItems } from '@/app/router/routes';
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
  driver: 'Tài xế',
  viewer: 'Viewer',
  sale: 'Sale',
};

const ROUTE_ICONS: Record<string, string> = {
  '/': '📊',
  '/quotations': '📋',
  '/orders': '📦',
  '/order-progress': '⏱️',
  '/shipments': '🚚',
  '/inventory': '🏭',
  '/customers': '👥',
  '/suppliers': '🤝',
  '/yarn-catalog': '🧵',
  '/fabric-catalog': '🪡',
  '/yarn-receipts': '📥',
  '/raw-fabric': '🧶',
  '/finished-fabric': '✨',
  '/payments': '💰',
  '/reports': '📈',
  '/shipping-rates': '💵',
  '/settings': '⚙️',
};

const LUCIDE_ICONS: Record<string, string> = {
  '/': 'Home',
  '/quotations': 'FileText',
  '/orders': 'Package',
  '/order-progress': 'Activity',
  '/shipments': 'Truck',
  '/inventory': 'Layers',
  '/customers': 'Users',
  '/payments': 'CircleDollarSign',
  '/settings': 'Settings',
};

export function AppShell() {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  return (
    <div className="shell-layout">
      <aside className="sidebar-nav">
        <div className="brand-block">
          <p className="eyebrow">Vĩnh Phát</p>
          <h1>ERP Sản xuất</h1>
        </div>

        <nav className="nav-stack" aria-label="Main navigation">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link${isActive ? ' is-active' : ''}`
              }
              end={item.path === '/'}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span className="nav-icon" aria-hidden="true">
                  {ROUTE_ICONS[item.path] ?? '📌'}
                </span>
                <span className="nav-link-title">{item.label}</span>
              </div>
              {item.path === '/orders' && stats?.overdueOrders ? (
                <span className="nav-badge danger">{stats.overdueOrders}</span>
              ) : item.path === '/quotations' && stats?.expiringQuotations ? (
                <span className="nav-badge warning">
                  {stats.expiringQuotations}
                </span>
              ) : null}
            </NavLink>
          ))}
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
          const iconName = LUCIDE_ICONS[item.path] || 'Component';
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
