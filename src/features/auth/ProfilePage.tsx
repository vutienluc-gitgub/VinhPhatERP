import { Badge } from '@/shared/components';

import { useAuth } from './AuthProvider';
import { PasskeySettingsCard } from './components/PasskeySettingsCard';

const roleLabel: Record<string, string> = {
  admin: 'Quản trị viên (Admin)',
  manager: 'Quản lý (Manager)',
  staff: 'Nhân viên (Staff)',
  viewer: 'Người xem (Viewer)',
};

/**
 * Trang thông tin tài khoản và quản lý thiết bị xác thực.
 * Route: /profile (protected, all roles)
 */
export function ProfilePage() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="profile-page max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ── Thông tin cá nhân ── */}
      <div className="hero-card bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Thông tin tài khoản
        </h2>

        <div className="profile-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="profile-row flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Email
            </span>
            <span className="text-sm font-medium text-foreground">
              {user?.email ?? '—'}
            </span>
          </div>

          <div className="profile-row flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Họ tên
            </span>
            <span className="text-sm font-medium text-foreground">
              {profile?.full_name || '—'}
            </span>
          </div>

          <div className="profile-row flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Vai trò
            </span>
            <span className="text-sm font-medium text-foreground">
              <span className="status-pill inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {roleLabel[profile?.role ?? ''] ?? profile?.role ?? '—'}
              </span>
            </span>
          </div>

          <div className="profile-row flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Điện thoại
            </span>
            <span className="text-sm font-medium text-foreground">
              {profile?.phone ?? '—'}
            </span>
          </div>

          <div className="profile-row flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Trạng thái
            </span>
            <div>
              {profile?.is_active === false ? (
                <Badge variant="danger">Bị khoá</Badge>
              ) : (
                <Badge variant="success">Hoạt động</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quản lý Passkey / Sinh trắc học ── */}
      <PasskeySettingsCard />

      {/* ── Đăng xuất ── */}
      <div className="panel-card bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-1">Đăng xuất</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Kết thúc phiên làm việc hiện tại trên thiết bị này.
        </p>
        <button
          type="button"
          className="px-4 py-2.5 bg-danger/10 text-danger hover:bg-danger/20 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          onClick={signOut}
        >
          Đăng xuất tài khoản
        </button>
      </div>
    </div>
  );
}
