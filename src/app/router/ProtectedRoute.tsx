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

  const roles: string[] = profile?.roles ?? [];
  const legacyRole: string = profile?.role ?? '';

  const isSupplier = roles.includes('supplier') || legacyRole === 'supplier';
  const isCustomer = roles.includes('customer') || legacyRole === 'customer';
  const isDriver = roles.includes('driver') || legacyRole === 'driver';

  // If user has employee-level role, allow them into ERP shell.
  // Note: 'viewer' is a read-only role that was previously given to external users.
  // If they are explicitly a supplier/customer, they are not an internal user despite having 'viewer'.
  const isInternalUser =
    ['admin', 'manager', 'staff', 'sale'].includes(legacyRole) ||
    (legacyRole === 'viewer' && !isSupplier && !isCustomer && !isDriver);

  if (!isInternalUser) {
    if (isSupplier) {
      return <Navigate to="/portal/supplier" replace />;
    }
    if (isCustomer) {
      return <Navigate to="/portal/customer" replace />;
    }
    if (isDriver) {
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
