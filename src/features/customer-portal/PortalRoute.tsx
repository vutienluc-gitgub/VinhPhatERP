import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { AuthLoadingScreen } from '@/shared/components/AuthLoadingScreen';

/**
 * Route guard for /portal/* — only allows role 'customer'.
 * All other roles are redirected to /unauthorized.
 */
export function PortalRoute() {
  const { session, profile, loading, isBlocked } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  if (profile?.role !== 'customer') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
