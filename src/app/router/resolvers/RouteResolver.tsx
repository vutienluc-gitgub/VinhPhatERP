import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import type { ERPPlugin, PluginRouteDefinition } from '@/app/types/plugin';
import type { UserRole } from '@/shared/types/database.models';
import { FeatureRegistry } from '@/shared/lib/FeatureRegistry';
import { evaluateAccess } from '@/shared/lib/rbac/RBACEvaluator';
import { ModuleErrorBoundary } from '@/shared/components/ModuleErrorBoundary';

// ─── Loading Fallback ────────────────────────────────────────────────────────

const LOADING_FALLBACK = <div className="table-empty">Dang tai...</div>;

// ─── Route Resolver ──────────────────────────────────────────────────────────

/**
 * RouteResolver — Transforms PluginRouteDefinition[] into RouteObject[].
 *
 * Responsibilities:
 *   - Reads registered plugins from FeatureRegistry
 *   - Filters by RBAC (user role/permissions)
 *   - Wraps each lazy component with Suspense + ModuleErrorBoundary
 *   - Supports nested routes recursively
 *   - Resolves print routes separately
 */

function wrapComponent(
  pluginKey: string,
  pluginLabel: string,
  loader: () => Promise<{ default: React.ComponentType }>,
): React.ComponentType {
  const LazyComponent = lazy(loader);

  function WrappedModulePage() {
    return (
      <ModuleErrorBoundary featureName={pluginLabel}>
        <Suspense fallback={LOADING_FALLBACK}>
          <LazyComponent />
        </Suspense>
      </ModuleErrorBoundary>
    );
  }
  WrappedModulePage.displayName = `Module(${pluginKey})`;

  return WrappedModulePage;
}

function convertRoutes(
  plugin: ERPPlugin,
  routes: PluginRouteDefinition[],
): RouteObject[] {
  return routes.map((route) => {
    let element: React.ReactNode = undefined;

    if (route.component) {
      const Component = wrapComponent(
        plugin.key,
        plugin.label,
        route.component,
      );
      element = <Component />;
    } else if (route.element) {
      element = route.element;
    }

    const routeObj: RouteObject = {
      path: route.path,
      element,
    };

    if (route.children && route.children.length > 0) {
      routeObj.children = convertRoutes(plugin, route.children);
    }

    return routeObj;
  });
}

/** Resolve all accessible routes for the given user context */
export function resolveAppRoutes(
  userRole?: UserRole | string,
  userPermissions?: string[],
): RouteObject[] {
  const plugins = FeatureRegistry.getAll();
  const routes: RouteObject[] = [];

  for (const plugin of plugins) {
    const hasAccess = evaluateAccess(
      {
        requiredRoles: plugin.requiredRoles,
        requiredPermissions: plugin.requiredPermissions,
      },
      { role: userRole, permissions: userPermissions },
    );

    if (!hasAccess) continue;
    if (!plugin.routes || plugin.routes.length === 0) continue;

    const converted = convertRoutes(plugin, plugin.routes);
    routes.push(...converted);
  }

  return routes;
}

/** Resolve all print routes (no RBAC filtering — print is internal) */
export function resolvePrintRoutes(): RouteObject[] {
  const plugins = FeatureRegistry.getAll();
  const routes: RouteObject[] = [];

  for (const plugin of plugins) {
    if (!plugin.printRoutes) continue;

    for (const printRoute of plugin.printRoutes) {
      const Component = wrapComponent(
        plugin.key,
        plugin.label,
        printRoute.component,
      );
      routes.push({
        path: printRoute.path,
        element: <Component />,
      });
    }
  }

  return routes;
}
