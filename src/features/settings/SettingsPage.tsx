import { CompanySettingsForm } from './CompanySettingsForm';

export function SettingsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚙️ Cài đặt</h1>
        <p className="page-subtitle">
          Quản lý thông tin công ty — hiển thị trên báo giá, phiếu xuất kho và
          các chứng từ.
        </p>
      </div>

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
          }}
        >
          🏢 Thông tin công ty
        </h2>
        <CompanySettingsForm />
      </section>
    </div>
  );
}
