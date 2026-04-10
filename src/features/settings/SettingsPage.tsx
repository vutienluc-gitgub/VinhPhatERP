import { CompanySettingsForm } from './CompanySettingsForm';
import { ColorsSection } from './ColorsSection';

export function SettingsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cài đặt hệ thống</h1>
          <p className="page-subtitle">
            Quản lý cấu hình công ty và danh mục dùng chung.
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
          <div style={{ padding: '1.5rem' }}>
            <CompanySettingsForm />
          </div>
        </div>

        <ColorsSection />
      </div>
    </div>
  );
}
