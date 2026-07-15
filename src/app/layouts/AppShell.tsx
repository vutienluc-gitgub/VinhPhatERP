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
import { useChatNotifications, useTotalUnread } from '@/application/chat';
import { ChatInboxDrawer } from '@/features/chat/ChatInboxDrawer';
import { getNavigationItems, hasAccess } from '@/app/router/routes';
import type { NavigationItem } from '@/app/router/routes';
import { useUserPreferences } from '@/shared/hooks/useUserPreferences';
import { Icon } from '@/shared/components/Icon';
import {
  PreferencesContext,
  type PreferencesContextValue,
} from '@/shared/context/preferences-context';
import { GROUP_LABELS } from '@/shared/constants/navigation';
import { GuideCommandPalette } from '@/features/guide-system/components/GuideCommandPalette';
import { GreigeCalculatorModal } from '@/features/costing/components/GreigeCalculatorModal';
import { APP_SHELL_LABELS, USER_ROLE_LABELS } from '@/shared/constants/layout';

import { MobileMoreDrawer } from './MobileMoreDrawer';
import { NotificationBell } from './NotificationBell';
import { AppLauncher } from './AppLauncher';

function getCurrentItem(pathname: string) {
  return getNavigationItems().find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );
}

/** Paths của các tab cố định ở bottom nav (mobile). */
const BOTTOM_TAB_PATHS = [
  '/',
  '/orders',
  '/raw-fabric',
  '/finished-fabric',
] as const;

export function AppShell() {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();

  // Enable global chat notifications (with sound)
  useChatNotifications({ soundEnabled: true });

  const [showMore, setShowMore] = useState(false);
  const closeMoreDrawer = useCallback(() => setShowMore(false), []);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChatInbox, setShowChatInbox] = useState(false);
  const [showCostingModal, setShowCostingModal] = useState(false);
  const totalUnread = useTotalUnread();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentItem = getCurrentItem(pathname);
  const navigationItems = getNavigationItems();

  // ── User Preferences từ DB (nguồn sự thật duy nhất) ─────────────────────────
  const { prefs, toggleTheme, setFluidLayout } = useUserPreferences(
    profile?.id,
  );

  // ── Khi bật fluid → lưu lại nhưng không còn ảnh hưởng đến sidebar ──────────────────────────────────
  useEffect(() => {
    const handleFluidChange = () => {
      if (prefs.fluid_layout) {
        // fluid_layout enabled
      }
    };
    window.addEventListener('layout-mode-changed', handleFluidChange);
    return () =>
      window.removeEventListener('layout-mode-changed', handleFluidChange);
  }, [prefs.fluid_layout]);

  const userRole = profile?.role;
  const visibleNavItems = navigationItems.filter((item) =>
    hasAccess(item.requiredRoles, userRole),
  );

  // Fixed bottom nav tabs (high-frequency features)
  const bottomTabs = BOTTOM_TAB_PATHS.map((p) =>
    visibleNavItems.find((item) => item.path === p),
  ).filter(
    (item): item is NavigationItem => item !== null && item !== undefined,
  );

  // All non-tab items for drawer (exclude bottom tabs to avoid duplicates)
  const drawerItems = visibleNavItems.filter(
    (item) => !(BOTTOM_TAB_PATHS as readonly string[]).includes(item.path),
  );

  // Check if active page is in the drawer (not in bottom tabs)
  const isDrawerActive = drawerItems.some((item) =>
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

  const initials = useMemo(() => {
    if (!profile?.full_name) return '?';
    const parts = profile.full_name.trim().split(/\s+/);
    const first = parts[0];
    if (!first) return '?';
    if (parts.length === 1) return first.slice(0, 2).toUpperCase();
    const last = parts[parts.length - 1];
    if (!last || !last[0]) return first[0]?.toUpperCase() || '?';
    return (first[0] + last[0]).toUpperCase();
  }, [profile?.full_name]);

  // ── Context value cho các component con ──────────────────────────────────────
  const preferencesContextValue = useMemo<PreferencesContextValue>(
    () => ({
      prefs,
      toggleTheme,
      setFluidLayout,
      // Pass noops for legacy context consumers if any
      setSidebarCollapsed: () => {},
      setSidebarGroupsCollapsed: () => {},
    }),
    [prefs, toggleTheme, setFluidLayout],
  );

  return (
    <PreferencesContext.Provider value={preferencesContextValue}>
      <div className="shell-layout">
        {/* Hiệu ứng Glow Premium */}
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />

        <div className="content-shell">
          <header className="topbar">
            {/* App Launcher & Brand Block */}
            <div className="topbar-brand-block">
              <AppLauncher />
              <NavLink to="/" className="topbar-brand-logo">
                <Icon
                  name="Hexagon"
                  size={20}
                  className="text-primary-strong"
                />
                <h1 className="title-premium-gradient text-base font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-primary-strong to-primary">
                  {APP_SHELL_LABELS.BRAND_NAME}
                </h1>
              </NavLink>
            </div>

            <div className="topbar-divider" />

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
                  {currentItem.group && GROUP_LABELS[currentItem.group] && (
                    <>
                      <span className="topbar-breadcrumb-current">
                        {GROUP_LABELS[currentItem.group]!.label}
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
                <span className="topbar-breadcrumb-current">
                  {APP_SHELL_LABELS.HOME}
                </span>
              )}
            </nav>

            <div className="topbar-spacer" />

            {/* Action icons */}
            <div className="topbar-actions" ref={userMenuRef}>
              <NavLink
                to="/guide"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted hover:bg-surface-subtle hover:text-foreground transition-colors mr-1"
                title={APP_SHELL_LABELS.GUIDE_TITLE}
              >
                <Icon name="BookOpen" size={16} strokeWidth={1.5} />
                <span className="hidden md:inline">
                  {APP_SHELL_LABELS.GUIDE}
                </span>
              </NavLink>

              <button
                type="button"
                onClick={() =>
                  document.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
                  )
                }
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted hover:bg-surface-subtle hover:text-foreground transition-colors mr-1"
                title={APP_SHELL_LABELS.SEARCH_PLACEHOLDER}
              >
                <Icon name="Search" size={16} strokeWidth={1.5} />
                <span className="hidden md:inline">
                  {APP_SHELL_LABELS.SEARCH}
                </span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-surface-subtle text-[10px] font-medium text-muted">
                  {APP_SHELL_LABELS.SEARCH_KBD}
                </kbd>
              </button>

              <button
                type="button"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-primary hover:bg-primary/10 transition-colors mr-1"
                onClick={() => setShowCostingModal(true)}
                title={APP_SHELL_LABELS.CALCULATOR_TITLE}
              >
                <Icon name="Calculator" size={16} strokeWidth={1.5} />
                <span className="hidden md:inline">
                  {APP_SHELL_LABELS.CALCULATOR}
                </span>
              </button>

              <button
                type="button"
                className="topbar-icon-btn"
                onClick={toggleTheme}
                title={
                  prefs.theme === 'dark'
                    ? APP_SHELL_LABELS.THEME_LIGHT
                    : APP_SHELL_LABELS.THEME_DARK
                }
                aria-label="Toggle Theme"
              >
                <Icon
                  name={prefs.theme === 'dark' ? 'Sun' : 'Moon'}
                  size={17}
                  strokeWidth={1.5}
                />
              </button>

              {profile?.role !== 'customer' && (
                <>
                  <button
                    type="button"
                    className="topbar-icon-btn topbar-chat-inbox-btn"
                    onClick={() => setShowChatInbox(true)}
                    title={APP_SHELL_LABELS.INBOX}
                    aria-label={APP_SHELL_LABELS.INBOX}
                    style={{ position: 'relative' }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {totalUnread > 0 && (
                      <span className="topbar-chat-badge">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </button>
                  <NotificationBell />
                </>
              )}

              <ChatInboxDrawer
                open={showChatInbox}
                onClose={() => setShowChatInbox(false)}
              />

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
                      {USER_ROLE_LABELS[profile.role] ?? profile.role}
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
                    {APP_SHELL_LABELS.LOGOUT}
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
        <nav className="mobile-nav" aria-label="Bottom navigation">
          {bottomTabs.map((item) => {
            const iconName =
              item.icon ?? (item.path === '/' ? 'Home' : 'Component');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `mobile-nav-link${isActive ? ' text-primary bg-primary/10' : ''}`
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
            className={`mobile-nav-link mobile-menu-btn${isDrawerActive ? ' text-primary bg-primary/10' : ''}`}
            onClick={() => setShowMore(true)}
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

        {showMore && (
          <MobileMoreDrawer items={drawerItems} onClose={closeMoreDrawer} />
        )}
        <GuideCommandPalette />

        {showCostingModal && (
          <GreigeCalculatorModal
            open={showCostingModal}
            onClose={() => setShowCostingModal(false)}
          />
        )}
      </div>
    </PreferencesContext.Provider>
  );
}
