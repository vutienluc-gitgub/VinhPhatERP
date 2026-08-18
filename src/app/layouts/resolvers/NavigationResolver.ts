import type { ERPPlugin, PluginGroup } from '@/app/types/plugin';
import type { UserRole } from '@/shared/types/database.models';
import { FeatureRegistry } from '@/shared/lib/FeatureRegistry';
import { evaluateAccess } from '@/shared/lib/rbac/RBACEvaluator';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NavItem {
  key: string;
  label: string;
  shortLabel: string;
  icon?: string;
  entryPath: string;
  group: PluginGroup;
  order: number;
  primaryMobile?: boolean;
}

export interface NavGroup {
  group: PluginGroup;
  items: NavItem[];
}

// ─── Navigation Resolver ─────────────────────────────────────────────────────

/**
 * NavigationResolver — Derives sidebar/mobile navigation from FeatureRegistry.
 *
 * Responsibilities:
 *   - Reads registered plugins from FeatureRegistry
 *   - Filters by RBAC (user role/permissions)
 *   - Maps to lightweight NavItem (no routes, no components)
 *   - Groups by PluginGroup, sorted by order
 */

function resolveEntryPath(plugin: ERPPlugin): string {
  if (plugin.entryPath) return plugin.entryPath;
  if (plugin.route) return `/${plugin.route}`;
  if (plugin.routes && plugin.routes.length > 0) {
    return `/${plugin.routes[0]?.path ?? ''}`;
  }
  return `/${plugin.key}`;
}

function pluginToNavItem(plugin: ERPPlugin): NavItem {
  return {
    key: plugin.key,
    label: plugin.label,
    shortLabel: plugin.shortLabel,
    icon: plugin.icon,
    entryPath: resolveEntryPath(plugin),
    group: plugin.group,
    order: plugin.order,
    primaryMobile: plugin.primaryMobile,
  };
}

/** Get flat list of accessible NavItems */
export function resolveNavItems(
  userRole?: UserRole | string,
  userPermissions?: string[],
): NavItem[] {
  const plugins = FeatureRegistry.getAll();

  return plugins
    .filter((plugin) =>
      evaluateAccess(
        {
          requiredRoles: plugin.requiredRoles,
          requiredPermissions: plugin.requiredPermissions,
        },
        { role: userRole, permissions: userPermissions },
      ),
    )
    .map(pluginToNavItem);
}

/** Get NavItems grouped by PluginGroup */
export function resolveNavGroups(
  userRole?: UserRole | string,
  userPermissions?: string[],
): NavGroup[] {
  const items = resolveNavItems(userRole, userPermissions);
  const groupMap = new Map<PluginGroup, NavItem[]>();

  for (const item of items) {
    const group = groupMap.get(item.group) ?? [];
    group.push(item);
    groupMap.set(item.group, group);
  }

  return Array.from(groupMap.entries()).map(([group, groupItems]) => ({
    group,
    items: groupItems.sort((a, b) => a.order - b.order),
  }));
}

/** Get mobile-prioritized NavItems */
export function resolveMobileNav(
  userRole?: UserRole | string,
  userPermissions?: string[],
): NavItem[] {
  return resolveNavItems(userRole, userPermissions).filter(
    (item) => item.primaryMobile,
  );
}
