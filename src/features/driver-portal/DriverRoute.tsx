import { Navigate, Outlet } from 'react-router-dom';

import { AuthLoadingScreen } from '@/shared/components/AuthLoadingScreen';
import { useAuth } from '@/shared/hooks/useAuth';

/**
 * DriverRoute — Bao ve route cho tai xe.
 * Chi cho phep user co role 'driver' vao.
 */
export function DriverRoute() {
  const { session, loading, profile } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'driver' && profile?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
