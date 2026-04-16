import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/shared/hooks/useAuth';

/**
 * DriverRoute — Bao ve route cho tai xe.
 * Chi cho phep user co role 'driver' vao.
 */
export function DriverRoute() {
  const { session, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Đang xác thực...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'driver') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
