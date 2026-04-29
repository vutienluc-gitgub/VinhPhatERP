import { useMemo } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useUserPermissions } from '@/api/permissions.api';

/**
 * Hook kiểm tra quyền của user hiện tại.
 *
 * Admin luôn có toàn quyền (bypass permission check).
 * Các role khác check dựa trên role_permissions table.
 *
 * @example
 * const { can, canAny, canAll } = usePermission();
 * if (can('orders:create')) { showCreateButton(); }
 * if (canAny(['orders:read', 'quotations:read'])) { showSalesMenu(); }
 */
export function usePermission() {
  const { profile } = useAuth();
  const role = profile?.role;
  const isAdmin = role === 'admin';

  const { data: rolePermissions, isLoading } = useUserPermissions(role);

  const grantedSet = useMemo(() => {
    if (isAdmin) return null; // Admin bypasses all checks
    const set = new Set<string>();
    if (rolePermissions) {
      for (const rp of rolePermissions) {
        if (rp.granted) set.add(rp.permission_key);
      }
    }
    return set;
  }, [isAdmin, rolePermissions]);

  /** Check single permission */
  const can = (permissionKey: string): boolean => {
    if (isAdmin) return true;
    if (!grantedSet) return false;
    return grantedSet.has(permissionKey);
  };

  /** Check if user has ANY of the given permissions */
  const canAny = (keys: string[]): boolean => {
    if (isAdmin) return true;
    return keys.some((k) => can(k));
  };

  /** Check if user has ALL of the given permissions */
  const canAll = (keys: string[]): boolean => {
    if (isAdmin) return true;
    return keys.every((k) => can(k));
  };

  return { can, canAny, canAll, isLoading, isAdmin };
}
