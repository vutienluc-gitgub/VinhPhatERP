import { Icon } from '@/shared/components/Icon';

import { CompanySettingsForm } from './CompanySettingsForm';

export function SettingsPage() {
  return (
    <div className="page-container p-4 md:p-6 pb-20 overflow-x-hidden">
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

      <div className="route-content">
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
      </div>
    </div>
  );
}
