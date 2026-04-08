import { useAuth } from './AuthProvider';

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  viewer: 'Viewer',
};

/**
 * Trang thông tin tài khoản cơ bản.
 * Route: /profile (protected, all roles)
 */
export function ProfilePage() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="profile-page">
      <div className="hero-card">
        <p className="eyebrow">Tài khoản</p>
        <h2>Thông tin cá nhân</h2>

        <div className="profile-grid">
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user?.email ?? '—'}</span>
          </div>

          <div className="profile-row">
            <span className="profile-label">Họ tên</span>
            <span className="profile-value">{profile?.full_name || '—'}</span>
          </div>

          <div className="profile-row">
            <span className="profile-label">Vai trò</span>
            <span className="profile-value">
              <span className="status-pill">
                {roleLabel[profile?.role ?? ''] ?? profile?.role ?? '—'}
              </span>
            </span>
          </div>

          <div className="profile-row">
            <span className="profile-label">Điện thoại</span>
            <span className="profile-value">{profile?.phone ?? '—'}</span>
          </div>

          <div className="profile-row">
            <span className="profile-label">Trạng thái</span>
            <span className="profile-value">
              {profile?.is_active === false ? (
                <span className="badge badge--danger">Bị khoá</span>
              ) : (
                <span className="badge badge--success">Hoạt động</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <h2>Đăng xuất</h2>
        <p>Kết thúc phiên làm việc hiện tại.</p>
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: '1rem' }}
          onClick={signOut}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
