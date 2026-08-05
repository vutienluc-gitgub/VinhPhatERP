import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { AuthLoadingScreen } from '@/shared/components/AuthLoadingScreen';
import type { UserRole } from '@/shared/types/database.models';

interface ProtectedRouteProps {
  /** Danh sách role được phép. Bỏ qua = tất cả role đều vào được. */
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const { session, loading, profile, isBlocked } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  // If user has employee-level role in legacy enum, allow them into ERP shell
  const roles: string[] = profile?.roles ?? [];
  const legacyRole: string = profile?.role ?? '';
  const isInternalUser = [
    'admin',
    'manager',
    'staff',
    'sale',
    'viewer',
  ].includes(legacyRole);

  if (!isInternalUser) {
    if (roles.includes('supplier') || legacyRole === 'supplier') {
      return <Navigate to="/portal/supplier" replace />;
    }
    if (roles.includes('customer') || legacyRole === 'customer') {
      return <Navigate to="/portal/customer" replace />;
    }
    if (roles.includes('driver') || legacyRole === 'driver') {
      return <Navigate to="/driver" replace />;
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = profile?.role;
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}
