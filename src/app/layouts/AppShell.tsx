import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { useChatNotifications, useTotalUnread } from '@/application/chat';
import { getNavigationItems, hasAccess } from '@/app/router/routes';
import type { NavigationItem } from '@/app/router/routes';
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

import { MobileMoreDrawer } from './MobileMoreDrawer';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, signOut } = useAuth();

  // Enable global chat notifications (with sound)
  useChatNotifications({ soundEnabled: true });

  // Tự động đồng bộ và đăng ký Web Push cho Admin/Staff khi đã cấp quyền
  usePushSubscription();

  const [showMore, setShowMore] = useState(false);
  const closeMoreDrawer = useCallback(() => setShowMore(false), []);
  const [showCostingModal, setShowCostingModal] = useState(false);
  const totalUnread = useTotalUnread();
  const { unreadCount: notifUnread } = useNotifications();
  const navigationItems = useMemo(() => getNavigationItems(), []);
  const currentItem = useMemo(() => getCurrentItem(pathname), [pathname]);

  // Đồng bộ số đếm huy hiệu icon PWA ngoài màn hình chính (Chat + Thông báo)
  const totalDeviceBadgeCount = (totalUnread || 0) + (notifUnread || 0);
  useAppBadging({ unreadCount: totalDeviceBadgeCount });

  // Xử lý deep link tự động khi chạm vào thông báo từ Service Worker hoặc màn hình khóa
  useNotificationDeepLink();

  // Mở Chat Inbox tự động khi app được khởi chạy từ thông báo đẩy (?chatOpen=1)
  useEffect(() => {
    if (searchParams.get('chatOpen') === '1') {
      window.dispatchEvent(new CustomEvent('navigate-to-chat'));
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('chatOpen');
      newParams.delete('roomId');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  // Fixed bottom nav tabs (high-frequency features)
  const bottomTabs = useMemo(
    () =>
      BOTTOM_TAB_PATHS.map((p) =>
        visibleNavItems.find((item) => item.path === p),
      ).filter(
        (item): item is NavigationItem => item !== null && item !== undefined,
      ),
    [visibleNavItems],
  );

  // All non-tab items for drawer (exclude bottom tabs to avoid duplicates)
  const drawerItems = useMemo(
    () =>
      visibleNavItems.filter(
        (item) => !(BOTTOM_TAB_PATHS as readonly string[]).includes(item.path),
      ),
    [visibleNavItems],
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

        {/* ── Mobile Bottom Nav (3 tabs + Menu) ── */}
        <MobileBottomNav
          bottomTabs={bottomTabs}
          isDrawerActive={isDrawerActive}
          onOpenMore={() => setShowMore(true)}
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
