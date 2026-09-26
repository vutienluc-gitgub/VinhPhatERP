import { Suspense, useCallback, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { useChatNotifications, useTotalUnread } from '@/application/chat';
import { getNavigationItems, hasAccess } from '@/app/router/routes';
import { useUserPreferences } from '@/shared/hooks/useUserPreferences';
import {
  PreferencesContext,
  type PreferencesContextValue,
} from '@/shared/context/preferences-context';
import { GuideCommandPalette } from '@/features/guide-system/components/GuideCommandPalette';
import { GreigeCalculatorModal } from '@/features/costing/components/GreigeCalculatorModal';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { useAppBadging } from '@/shared/hooks/useAppBadging';
import { useNotificationDeepLink } from '@/shared/hooks/useNotificationDeepLink';
import { usePushSubscription } from '@/shared/hooks/usePushSubscription';
import { resolveRoleBottomTabs } from '@/app/layouts/resolvers/role-tabs.config';

import { MobileMoreDrawer } from './MobileMoreDrawer';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';

function getCurrentItem(pathname: string) {
  return getNavigationItems().find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();

  // Enable global chat notifications (with sound)
  useChatNotifications({ soundEnabled: true });

  // Tự động đăng ký Web Push cho tài khoản nội bộ (Admin/Manager/Staff)
  usePushSubscription();

  const totalUnread = useTotalUnread();
  const { unreadCount: notifUnread } = useNotifications();
  const [showMore, setShowMore] = useState(false);
  const closeMoreDrawer = useCallback(() => setShowMore(false), []);
  const [showCostingModal, setShowCostingModal] = useState(false);
  const navigationItems = useMemo(() => getNavigationItems(), []);
  const currentItem = useMemo(() => getCurrentItem(pathname), [pathname]);

  // Đồng bộ số đếm huy hiệu icon PWA ngoài màn hình chính (Chat + Thông báo)
  const totalDeviceBadgeCount = (totalUnread || 0) + (notifUnread || 0);
  useAppBadging({ unreadCount: totalDeviceBadgeCount });

  // Xử lý deep link tự động khi chạm vào thông báo từ Service Worker hoặc màn hình khóa
  useNotificationDeepLink();

  // ── User Preferences từ DB (nguồn sự thật duy nhất) ─────────────────────────
  const { prefs, toggleTheme, setFluidLayout } = useUserPreferences(
    profile?.id,
  );

  const userRole = profile?.role;
  const visibleNavItems = useMemo(
    () =>
      navigationItems.filter((item) => hasAccess(item.requiredRoles, userRole)),
    [navigationItems, userRole],
  );

  // Dynamic role-based bottom nav tabs (high-frequency features per role)
  const bottomTabs = useMemo(
    () =>
      resolveRoleBottomTabs({
        visibleNavItems,
        userRole,
        maxTabs: 4,
      }),
    [visibleNavItems, userRole],
  );

  const bottomTabPaths = useMemo(
    () => new Set(bottomTabs.map((item) => item.path)),
    [bottomTabs],
  );

  // All non-tab items for drawer (exclude active bottom tabs to avoid duplicates)
  const drawerItems = useMemo(
    () => visibleNavItems.filter((item) => !bottomTabPaths.has(item.path)),
    [visibleNavItems, bottomTabPaths],
  );

  // Check if active page is in the drawer (not in bottom tabs)
  const isDrawerActive = useMemo(
    () =>
      drawerItems.some((item) =>
        item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
      ),
    [drawerItems, pathname],
  );

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
          <TopBar
            profile={profile}
            signOut={signOut}
            prefs={prefs}
            toggleTheme={toggleTheme}
            totalUnread={totalUnread}
            currentItem={currentItem}
            onOpenCosting={() => setShowCostingModal(true)}
            initials={initials}
          />

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

        {/* ── Mobile Bottom Nav (Role-aware tabs + Menu) ── */}
        <MobileBottomNav
          bottomTabs={bottomTabs}
          isDrawerActive={isDrawerActive}
          onOpenMore={() => setShowMore(true)}
          menuBadge={
            totalDeviceBadgeCount > 0 ? totalDeviceBadgeCount : undefined
          }
          menuHasDot={totalDeviceBadgeCount > 0}
        />

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
