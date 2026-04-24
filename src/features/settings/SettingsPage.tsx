import { CompanySettingsForm } from './CompanySettingsForm';

export function SettingsPage() {
  return (
    <div className="page-container p-4 md:p-6 overflow-x-hidden">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cài đặt hệ thống</h1>
          <p className="page-subtitle">
            Quản lý cấu hình công ty và các tham số vận hành.
          </p>
        </div>
      </div>

      <div className="route-content">
        <div className="panel-card card-flush">
          <div className="card-header-premium">
            <div>
              <p className="eyebrow-premium">Cài đặt hệ thống</p>
              <h2 className="title-premium">Thông tin công ty</h2>
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
