import { useAuth } from '@/features/auth/AuthProvider';
import { Icon } from '@/shared/components/Icon';
import { Switch } from '@/shared/components/Switch';
import { useFluidDashboard } from '@/shared/hooks/useLayoutMode';

import { CompanySettingsForm } from './CompanySettingsForm';

export function SettingsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { isFluid, setIsFluid } = useFluidDashboard();

  return (
    <div className="page-container pb-20">
      <div className="page-header mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon name="Settings" size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="page-title m-0">Cài đặt hệ thống</h1>
            <p className="page-subtitle m-0">
              Quản lý cấu hình công ty và các tham số vận hành.
            </p>
          </div>
        </div>
      </div>

      <div className="route-content flex flex-col gap-6">
        <div className="panel-card card-flush">
          <div className="card-header-premium">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Icon name="Building2" size={20} strokeWidth={1.5} />
              </div>
              <div>
                <p className="eyebrow-premium">Cài đặt hệ thống</p>
                <h2 className="title-premium m-0">Thông tin công ty</h2>
              </div>
            </div>
          </div>
          <div className="p-6">
            <CompanySettingsForm />
          </div>
        </div>

        {isAdmin && (
          <div className="panel-card card-flush">
            <div className="card-header-premium">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Icon name="LayoutTemplate" size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="eyebrow-premium text-purple-600">
                    Quyền quản trị
                  </p>
                  <h2 className="title-premium m-0">Hiển thị hệ thống</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="max-w-lg">
                <Switch
                  id="layout-mode-switch"
                  checked={isFluid}
                  onChange={setIsFluid}
                  label="Chế độ tràn viền (Fluid Dashboard)"
                  description="Bật công tắc này để giao diện mở rộng 100% diện tích màn hình."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
