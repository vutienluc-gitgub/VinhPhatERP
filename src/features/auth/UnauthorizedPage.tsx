import { useNavigate } from 'react-router-dom';

import { useAuth } from './AuthProvider';

/**
 * Trang 403 — hiển thị khi user đã đăng nhập nhưng role không đủ quyền.
 */
export function UnauthorizedPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    staff: 'Staff',
    viewer: 'Viewer',
  };

  return (
    <div className="auth-page">
      <div className="auth-status-card">
        <h2 className="text-xl font-bold mt-0">Không đủ quyền</h2>
        <p className="auth-status-body">
          Tài khoản của bạn có vai trò{' '}
          <strong>{roleLabel[profile?.role ?? ''] ?? profile?.role}</strong> và
          không được phép truy cập vào trang này.
        </p>
        <div className="auth-status-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/', { replace: true })}
          >
            Về Dashboard
          </button>
          <button type="button" className="secondary-button" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
