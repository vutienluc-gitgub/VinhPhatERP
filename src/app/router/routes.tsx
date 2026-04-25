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
  import('@/features/auth/AuthPage').then((m) => ({ default: m.AuthPage })),
);

const AuthCallback = lazy(() =>
  import('@/features/auth/AuthCallback').then((m) => ({
    default: m.AuthCallback,
  })),
);

/**
 * Convert a FeaturePlugin to an array of RouteObjects to support subRoutes natively.
 * Uses React.lazy() with the plugin's component loader.
 */
function pluginToRoute(plugin: FeaturePlugin): RouteObject[] {
  const routes: RouteObject[] = [];

  // 1. Phân tích cấu trúc mới 'routes' (Nested Routes / Mạng phẳng routes)
  if (plugin.routes && plugin.routes.length > 0) {
    for (const r of plugin.routes) {
      const LazyComponent = lazy(r.component);
      routes.push({
        path: r.path,
        element: (
          <LazyPage>
            <LazyComponent />
          </LazyPage>
        ),
        // Có thể áp dụng đệ quy cho r.children nếu cần, ở đây hỗ trợ basic nesting
      });
    }
  }
  // 2. Chế độ Legacy fallback (route + component)
  else if (plugin.route && plugin.component) {
    const LazyComponent = lazy(plugin.component);
    routes.push({
      path: plugin.route,
      element: (
        <LazyPage>
          <LazyComponent />
        </LazyPage>
      ),
    });
  }

  // 3. Chế độ SubRoutes (Khả dụng với Legacy fallback)
  if (plugin.subRoutes && plugin.subRoutes.length > 0) {
    for (const sub of plugin.subRoutes) {
      const SubComponent = lazy(sub.component);
      routes.push({
        path: sub.path,
        element: (
          <LazyPage>
            <SubComponent />
          </LazyPage>
        ),
      });
    }
  }

  return routes;
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
    icon: 'Home',
    primaryMobile: true,
  };

  const pluginItems: NavigationItem[] = FeatureRegistry.getAll().map((p) => {
    // 1. Dùng p.route (legacy) hoặc fallback sang path đầu tiên của p.routes
    let routePath = p.route;
    if (!routePath && p.routes && p.routes.length > 0) {
      routePath = p.routes[0]?.path;
    }

    return {
      path: `/${routePath}`,
      label: p.label,
      shortLabel: p.shortLabel,
      description: p.description,
      icon: p.icon,
      primaryMobile: p.primaryMobile,
      group: p.group,
      requiredRoles: p.requiredRoles,
    };
  });

  return [dashboardItem, ...pluginItems];
}

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
export function createAppRoutes(): RouteObject[] {
  return [
    {
      index: true,
      element: <DashboardPage />,
    },
    ...FeatureRegistry.getAll()
      .filter((p) => !p.routeGuard)
      .flatMap(pluginToRoute),
  ];
}

/** Print routes from all plugins */
export function createPrintRoutes(): RouteObject[] {
  return FeatureRegistry.getPrintRoutes().map((pr) => {
    const LazyComponent = lazy(pr.component);
    return {
      path: pr.path,
      element: (
        <LazyPage>
          <LazyComponent />
        </LazyPage>
      ),
    };
  });
}

/** Routes chỉ dành cho admin và manager (routeGuard === 'manager') */
export function createManagerRoutes(): RouteObject[] {
  return FeatureRegistry.getAll()
    .filter((p) => p.routeGuard === 'manager')
    .flatMap(pluginToRoute);
}

/** Routes chỉ dành cho admin (routeGuard === 'admin') */
export function createAdminRoutes(): RouteObject[] {
  return FeatureRegistry.getAll()
    .filter((p) => p.routeGuard === 'admin')
    .flatMap(pluginToRoute);
}
