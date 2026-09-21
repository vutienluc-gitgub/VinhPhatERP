import type { UserRole } from '@/shared/types/database.models';

export class RBACEvaluator {
  static hasRole(userRole: UserRole | undefined, requiredRoles?: UserRole[] | string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!userRole) return false;
    return (requiredRoles as string[]).includes(userRole);
  }

  static hasPermission(permissions: string[] | undefined, requiredPermissions?: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    if (!permissions) return false;
    return requiredPermissions.some((p) => permissions.includes(p));
  }
}
