import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { LazyPage } from '@/app/router/LazyPage';
import { FeatureRegistry } from '@/shared/lib/FeatureRegistry';
import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { UserRole } from '@/services/supabase/database.types';

/* ── Dashboard (always the index route, not a plugin) ── */
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  })),
);

/* ── Auth (special route, not a plugin) ── */
const AuthPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.AuthPage })),
);

const AuthCallback = lazy(() =>
  import('@/features/auth/AuthCallback').then((m) => ({
    default: m.AuthCallback,
  })),
);

/**
 * Convert a FeaturePlugin to a RouteObject.
 * Uses React.lazy() with the plugin's component loader.
 */
function pluginToRoute(plugin: FeaturePlugin): RouteObject {
  const LazyComponent = lazy(plugin.component);
  return {
    path: plugin.route,
    element: (
      <LazyPage>
        <LazyComponent />
      </LazyPage>
    ),
  };
}

/* ── Navigation (re-exported for Sidebar/BottomNav) ── */

export type NavigationItem = {
  path: string;
  label: string;
  shortLabel: string;
  description: string;
  icon?: string;
  primaryMobile?: boolean;
  group?: string;
  requiredRoles?: UserRole[];
};

/**
 * Generate navigation items from FeatureRegistry.
 * Replaces the old hardcoded `navigationItems` array.
 */
export function getNavigationItems(): NavigationItem[] {
  const dashboardItem: NavigationItem = {
    path: '/',
    label: 'Tổng quan',
    shortLabel: 'Home',
    description:
      'Tổng quan scaffold, trạng thái hiện tại và các bước tiếp theo.',
    icon: 'home',
    primaryMobile: true,
  };

  const pluginItems: NavigationItem[] = FeatureRegistry.getAll().map((p) => ({
    path: `/${p.route}`,
    label: p.label,
    shortLabel: p.shortLabel,
    description: p.description,
    icon: p.icon,
    primaryMobile: p.primaryMobile,
    group: p.group,
    requiredRoles: p.requiredRoles,
  }));

  return [dashboardItem, ...pluginItems];
}

// Legacy compat
export const navigationItems: NavigationItem[] = getNavigationItems();

const ResetPasswordPage = lazy(() =>
  import('@/features/auth/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
);

export const authRoute: RouteObject = {
  path: 'auth',
  children: [
    {
      index: true,
      element: (
        <LazyPage>
          <AuthPage />
        </LazyPage>
      ),
    },
    {
      path: 'callback',
      element: (
        <LazyPage>
          <AuthCallback />
        </LazyPage>
      ),
    },
    {
      path: 'reset-password',
      element: (
        <LazyPage>
          <ResetPasswordPage />
        </LazyPage>
      ),
    },
  ],
};

/** Routes cho tất cả authenticated user (route không có routeGuard) */
export const appRoutes: RouteObject[] = [
  {
    index: true,
    element: <DashboardPage />,
  },
  ...FeatureRegistry.getAll()
    .filter((p) => !p.routeGuard)
    .map(pluginToRoute),
];

/** Print routes from all plugins */
export const printRoutes: RouteObject[] = FeatureRegistry.getPrintRoutes().map(
  (pr) => {
    const LazyComponent = lazy(pr.component);
    return {
      path: pr.path,
      element: (
        <LazyPage>
          <LazyComponent />
        </LazyPage>
      ),
    };
  },
);

/** Routes chỉ dành cho admin và manager (routeGuard === 'manager') */
export const managerRoutes: RouteObject[] = FeatureRegistry.getAll()
  .filter((p) => p.routeGuard === 'manager')
  .map(pluginToRoute);

/** Routes chỉ dành cho admin (routeGuard === 'admin') */
export const adminRoutes: RouteObject[] = FeatureRegistry.getAll()
  .filter((p) => p.routeGuard === 'admin')
  .map(pluginToRoute);
