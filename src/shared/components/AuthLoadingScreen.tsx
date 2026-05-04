import { Icon } from '@/shared/components/Icon';
import '@/styles/auth.css';

export function AuthLoadingScreen() {
  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-content">
        <div className="auth-spinner">
          <Icon name="Loader2" size={48} className="spin-icon" />
        </div>
        <h2 className="auth-loading-title">Đang xác thực...</h2>
        <p className="auth-loading-subtitle">
          Vui lòng đợi trong giây lát, hệ thống đang kiểm tra phiên làm việc của
          bạn.
        </p>
      </div>
    </div>
  );
}
