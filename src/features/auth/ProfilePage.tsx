import { Badge } from '@/shared/components';

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
  const { user, profile, signOut, registerPasskeyDevice } = useAuth();

  return (
    <div className="profile-page">
      <div className="hero-card">
        <h2 className="text-xl font-bold mt-0 mb-4">Thông tin cá nhân</h2>

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
                <Badge variant="danger">Bị khoá</Badge>
              ) : (
                <Badge variant="success">Hoạt động</Badge>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="panel-card mt-4">
        <h2 className="text-lg font-bold mb-2">Sinh trắc học & Passkey</h2>
        <p className="text-sm text-muted mb-3">
          Đăng ký thiết bị hiện tại (Face ID / Touch ID / Vân tay) để đăng nhập
          1 chạm nhanh chóng.
        </p>
        <button
          type="button"
          className="primary-button inline-flex items-center gap-2"
          onClick={async () => {
            try {
              await registerPasskeyDevice();
              alert('Đăng ký sinh trắc học thành công!');
            } catch (err) {
              alert(err instanceof Error ? err.message : String(err));
            }
          }}
        >
          Đăng ký thiết bị này
        </button>
      </div>

      <div className="panel-card">
        <h2>Đăng xuất</h2>
        <p>Kết thúc phiên làm việc hiện tại.</p>
        <button type="button" className="primary-button mt-4" onClick={signOut}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
