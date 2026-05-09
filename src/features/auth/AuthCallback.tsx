import '@/styles/auth.css';

import { AUTH_CALLBACK } from './auth-callback.constants';
import { useAuthCallback } from './useAuthCallback';

export function AuthCallback() {
  const { status, errorMessage, goToLogin } = useAuthCallback();

  if (status === 'error') {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-content">
          <p className="text-danger font-semibold mb-2">
            {AUTH_CALLBACK.ERROR_TITLE}
          </p>
          <p className="auth-loading-subtitle mb-6">
            {errorMessage ?? AUTH_CALLBACK.MISSING_CREDENTIALS_ERROR}
          </p>
          <button type="button" className="auth-submit-btn" onClick={goToLogin}>
            {AUTH_CALLBACK.BACK_TO_LOGIN}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-content">
        <div className="auth-spinner spin-icon w-10 h-10 border-[3px] border-current/20 border-t-current rounded-full" />
        <p className="auth-loading-subtitle">{AUTH_CALLBACK.LOADING_TEXT}</p>
      </div>
    </div>
  );
}
