import { useAuth } from './AuthProvider'

/**
 * Trang bị khoá — hiển thị khi tài khoản có is_active = false.
 * Người dùng chỉ có thể đăng xuất.
 */
export function BlockedPage() {
  const { signOut, user } = useAuth()

  return (
    <div className="auth-page">
      <div className="auth-status-card">
        <p className="eyebrow">Tài khoản bị khoá</p>
        <h2>Không thể đăng nhập</h2>
        <p className="auth-status-body">
          Tài khoản <strong>{user?.email}</strong> đã bị vô hiệu hoá. Vui lòng liên hệ quản
          trị viên để được hỗ trợ.
        </p>
        <div className="auth-status-actions">
          <button type="button" className="primary-button" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  )
}
