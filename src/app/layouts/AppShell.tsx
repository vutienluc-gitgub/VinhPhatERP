import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { useDashboardStats } from '@/application/analytics';
import { getNavigationItems } from '@/app/router/routes';
import type { NavigationItem } from '@/app/router/routes';
import type { UserRole } from '@/services/supabase/database.types';
import { useTheme } from '@/shared/hooks/useTheme';
import { Icon } from '@/shared/components/Icon';

import { MobileMoreDrawer } from './MobileMoreDrawer';
import { NotificationBell } from './NotificationBell';

function getCurrentItem(pathname: string) {
  return getNavigationItems().find((item) =>
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
  customer: 'Khách hàng',
};

/** Group display metadata */
const GROUP_LABELS: Record<string, { label: string; icon: string }> = {
  sales: {
    label: 'Kinh doanh',
    icon: 'Briefcase',
  },
  production: {
    label: 'Sản xuất',
    icon: 'Factory',
  },
  'master-data': {
    label: 'Danh mục',
    icon: 'Database',
  },
  system: {
    label: 'Hệ thống',
    icon: 'Shield',
  },
};

const GROUP_ORDER = ['sales', 'production', 'master-data', 'system'];

const STORAGE_KEY = 'erp-sidebar-collapsed';
const SIDEBAR_WIDTH_KEY = 'erp-sidebar-width-collapsed';

function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_WIDTH_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveSidebarCollapsed(state: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(state));
  } catch {
    /* ignore */
  }
}

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useState<boolean>(loadSidebarCollapsed);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentItem = getCurrentItem(pathname);
  const { data: stats } = useDashboardStats();
  const { theme, toggleTheme } = useTheme();
  const navigationItems = getNavigationItems();

  // Khi bật fluid → tự động thu gọn sidebar (user vẫn toggle được bình thường)
  useEffect(() => {
    const handleFluidChange = () => {
      const isFluid = localStorage.getItem('erp-fluid-dashboard') === 'true';
      if (isFluid) {
        setIsSidebarCollapsed(true);
        saveSidebarCollapsed(true);
      }
    };
    window.addEventListener('layout-mode-changed', handleFluidChange);
    return () =>
      window.removeEventListener('layout-mode-changed', handleFluidChange);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      saveSidebarCollapsed(next);
      // Khi mở sidebar từ icon-only → reset tất cả group về trạng thái mở
      // để tránh animation kẹt (CSS override biến mất, JS state cũ chiếm quyền)
      if (!next) {
        setCollapsed({});
        saveCollapsed({});
      }
      return next;
    });
  }, []);

  const userRole = profile?.role;
  const visibleNavItems = navigationItems.filter((item) =>
    hasAccess(item.requiredRoles, userRole),
  );

  // Fixed bottom nav tabs (high-frequency features)
  const BOTTOM_TAB_PATHS = ['/', '/orders', '/dyeing-orders'];
  const bottomTabs = BOTTOM_TAB_PATHS.map((p) =>
    visibleNavItems.find((item) => item.path === p),
  ).filter(
    (item): item is NavigationItem => item !== null && item !== undefined,
  );

  // All non-tab items for drawer (exclude bottom tabs to avoid duplicates)
  const drawerItems = visibleNavItems.filter(
    (item) => !BOTTOM_TAB_PATHS.includes(item.path),
  );

  // Check if active page is in the drawer (not in bottom tabs)
  const isDrawerActive = drawerItems.some((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );

  // Dashboard item (no group) for sidebar
  const dashboardItem = visibleNavItems.find((item) => item.path === '/');

  // Group remaining items for sidebar
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
        title={isSidebarCollapsed ? item.label : undefined}
      >
        <div className="nav-link-inner">
          <span className="nav-icon" aria-hidden="true">
            <Icon name={iconName} size={18} strokeWidth={1.5} />
          </span>
          <span className="nav-link-title">{item.label}</span>
        </div>
        {!isSidebarCollapsed &&
        item.path === '/orders' &&
        stats?.overdueOrders ? (
          <span className="nav-badge danger">{stats.overdueOrders}</span>
        ) : !isSidebarCollapsed &&
          item.path === '/quotations' &&
          stats?.expiringQuotations ? (
          <span className="nav-badge warning">{stats.expiringQuotations}</span>
        ) : null}
      </NavLink>
    );
  }

  return (
    <div className={`shell-layout${isSidebarCollapsed ? ' is-collapsed' : ''}`}>
      {/* Hiệu ứng Glow Premium */}
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <aside className="sidebar-nav">
        <div className="brand-block" style={{ position: 'relative' }}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="brand-icon-wrapper">
                <Icon
                  name="Hexagon"
                  size={24}
                  className="text-primary-strong"
                />
              </div>
              <div className="flex flex-col">
                <p className="eyebrow-premium text-[10px] uppercase tracking-widest opacity-70 mb-0">
                  Vĩnh Phát
                </p>
                <h1 className="title-premium-gradient text-lg font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-primary-strong to-primary">
                  ERP Sản xuất
                </h1>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '42px',
              }}
            >
              <Icon name="Hexagon" size={24} className="text-primary-strong" />
            </div>
          )}
          <button
            type="button"
            className="sidebar-collapse-btn hidden lg:flex"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            <Icon
              name={isSidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'}
              size={14}
            />
          </button>
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
                  <div>{g.items.map(renderNavLink)}</div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          {/* Breadcrumb */}
          <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
            <NavLink to="/">
              <Icon name="Home" size={15} strokeWidth={1.5} />
            </NavLink>
            {currentItem && currentItem.path !== '/' && (
              <>
                <Icon
                  name="ChevronRight"
                  size={12}
                  className="topbar-breadcrumb-sep"
                />
                {currentItem.shortLabel &&
                  currentItem.shortLabel !== currentItem.label && (
                    <>
                      <span className="topbar-breadcrumb-current">
                        {currentItem.shortLabel}
                      </span>
                      <Icon
                        name="ChevronRight"
                        size={12}
                        className="topbar-breadcrumb-sep"
                      />
                    </>
                  )}
                <span className="topbar-breadcrumb-current">
                  {currentItem.label}
                </span>
              </>
            )}
            {!currentItem && (
              <span className="topbar-breadcrumb-current">Tổng quan</span>
            )}
          </nav>

          <div className="topbar-spacer" />

          {/* Action icons */}
          <div className="topbar-actions" ref={userMenuRef}>
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
              aria-label="Toggle Theme"
            >
              <Icon
                name={theme === 'dark' ? 'Sun' : 'Moon'}
                size={17}
                strokeWidth={1.5}
              />
            </button>

            {profile?.role !== 'customer' && <NotificationBell />}

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
                <Icon name="ChevronDown" size={16} strokeWidth={1.5} />
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
                  <Icon name="LogOut" size={16} strokeWidth={1.5} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="route-content">
          <Suspense
            fallback={
              <div className="flex-center p-10">
                <div className="spinner" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* ── Mobile Bottom Nav (3 tabs + Menu) ── */}
      <nav
        className="mobile-nav fixed left-0 right-0 w-full z-50 bg-surface-strong border-t border-border pb-[env(safe-area-inset-bottom)]"
        aria-label="Bottom navigation"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          margin: 0,
        }}
      >
        {bottomTabs.map((item) => {
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
          className={`mobile-nav-link mobile-menu-btn${isDrawerActive ? ' is-active' : ''}`}
          onClick={() => setShowMore(true)}
          aria-label="Menu"
        >
          <Icon
            name="LayoutGrid"
            size={22}
            strokeWidth={isDrawerActive ? 2.2 : 1.6}
          />
          <span>Menu</span>
        </button>
      </nav>

      {showMore && (
        <MobileMoreDrawer
          items={drawerItems}
          onClose={() => setShowMore(false)}
        />
      )}
    </div>
  );
}
