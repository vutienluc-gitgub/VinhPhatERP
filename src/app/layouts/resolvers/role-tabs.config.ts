import type { NavigationItem } from '@/app/router/routes';
import type { UserRole } from '@/shared/types/database.models';

export const FALLBACK_BOTTOM_TAB_PATHS: readonly string[] = [
  '/',
  '/orders',
  '/raw-fabric',
  '/finished-fabric',
] as const;

/**
 * Default preferred bottom tab paths per role.
 * On mobile, screen estate allows Home ('/') + 2-3 essential business tabs + Menu Drawer.
 */
export const DEFAULT_ROLE_BOTTOM_TAB_PATHS: Record<string, readonly string[]> =
  {
    sale: ['/', '/orders', '/quotes', '/customers'],
    driver: ['/', '/shipments', '/orders'],
    customer: ['/', '/orders'],
    staff: FALLBACK_BOTTOM_TAB_PATHS,
    manager: FALLBACK_BOTTOM_TAB_PATHS,
    admin: FALLBACK_BOTTOM_TAB_PATHS,
    viewer: FALLBACK_BOTTOM_TAB_PATHS,
    default: FALLBACK_BOTTOM_TAB_PATHS,
  };

/**
 * Returns the preferred bottom tab paths for a given role.
 */
export function getRoleBottomTabPaths(
  role?: UserRole | string,
): readonly string[] {
  if (!role) {
    return FALLBACK_BOTTOM_TAB_PATHS;
  }
  const matched = DEFAULT_ROLE_BOTTOM_TAB_PATHS[role];
  return matched ?? FALLBACK_BOTTOM_TAB_PATHS;
}

export interface ResolveRoleBottomTabsOptions {
  visibleNavItems: NavigationItem[];
  userRole?: UserRole | string;
  maxTabs?: number;
}

/**
 * Dynamically resolves bottom navigation tabs for mobile view based on user role and permissions.
 *
 * Rules:
 * 1. Home ('/') is always preserved as the first tab if accessible.
 * 2. Matches role-preferred paths against visible (accessible) items.
 * 3. Falls back to items marked with `primaryMobile: true` or accessible items if preferred paths are inaccessible.
 * 4. Limits total tabs to `maxTabs` (default: 4 tabs: Home + up to 3 business tabs).
 */
export function resolveRoleBottomTabs({
  visibleNavItems,
  userRole,
  maxTabs = 4,
}: ResolveRoleBottomTabsOptions): NavigationItem[] {
  if (!visibleNavItems || visibleNavItems.length === 0) {
    return [];
  }

  const selectedTabs: NavigationItem[] = [];
  const selectedPaths = new Set<string>();

  // 1. Home ('/') is always first if accessible
  const homeItem = visibleNavItems.find((item) => item.path === '/');
  if (homeItem) {
    selectedTabs.push(homeItem);
    selectedPaths.add('/');
  }

  // 2. Add role-preferred paths that are accessible
  const preferredPaths = getRoleBottomTabPaths(userRole);
  for (const path of preferredPaths) {
    if (path === '/' || selectedPaths.has(path)) continue;
    if (selectedTabs.length >= maxTabs) break;

    const matchedItem = visibleNavItems.find((item) => item.path === path);
    if (matchedItem) {
      selectedTabs.push(matchedItem);
      selectedPaths.add(matchedItem.path);
    }
  }

  // 3. Fallback: If still under maxTabs, add accessible items with primaryMobile = true
  if (selectedTabs.length < maxTabs) {
    for (const item of visibleNavItems) {
      if (selectedTabs.length >= maxTabs) break;
      if (item.primaryMobile && !selectedPaths.has(item.path)) {
        selectedTabs.push(item);
        selectedPaths.add(item.path);
      }
    }
  }

  // 4. Fallback: If still under maxTabs, fill with remaining accessible items
  if (selectedTabs.length < maxTabs) {
    for (const item of visibleNavItems) {
      if (selectedTabs.length >= maxTabs) break;
      if (!selectedPaths.has(item.path)) {
        selectedTabs.push(item);
        selectedPaths.add(item.path);
      }
    }
  }

  return selectedTabs;
}
