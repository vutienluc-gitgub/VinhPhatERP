import type { UserRole } from '@/shared/types/database.models';

/**
 * RBACEvaluator — Centralized access evaluation.
 *
 * Semantics:
 * - No roles & no perms  -> Authenticated user allowed
 * - Roles only           -> roles.includes(userRole)
 * - Perms only           -> userPerms has at least 1 match
 * - Both roles & perms   -> (Role Match) AND (Perm Match)
 *
 * NOTE: Frontend RBAC is a Navigation/View Gate only.
 * Backend RLS is always the final Security Boundary.
 */

interface RBACConfig {
  requiredRoles?: UserRole[] | string[];
  requiredPermissions?: string[];
}

interface UserContext {
  role?: UserRole | string;
  permissions?: string[];
}

function checkRoleAccess(
  requiredRoles: UserRole[] | string[] | undefined,
  userRole: UserRole | string | undefined,
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRole) return false;
  return (requiredRoles as string[]).includes(userRole as string);
}

function checkPermissionAccess(
  requiredPermissions: string[] | undefined,
  userPermissions: string[] | undefined,
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

/**
 * Evaluate whether a user has access to a resource.
 *
 * @returns true if user satisfies the RBAC config requirements
 */
export function evaluateAccess(config: RBACConfig, user: UserContext): boolean {
  const roleOk = checkRoleAccess(config.requiredRoles, user.role);
  const permOk = checkPermissionAccess(
    config.requiredPermissions,
    user.permissions,
  );
  return roleOk && permOk;
}
