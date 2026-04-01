import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthProvider'
import type { UserRole } from '@/services/supabase/database.types'

interface ProtectedRouteProps {
  /** Danh sách role được phép. Bỏ qua = tất cả role đều vào được. */
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const { session, loading, profile, isBlocked } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Đang xác thực…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  if (isBlocked) {
    return <Navigate to="/blocked" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = profile?.role
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <Outlet />
}
