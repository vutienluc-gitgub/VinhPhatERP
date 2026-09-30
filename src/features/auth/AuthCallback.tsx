import { useEffect, useState } from 'react';

import '@/styles/auth.css';
import { Icon } from '@/shared/components';
import { AUTH_CALLBACK } from '@/features/auth/auth-callback.constants';
import { useAuthCallback } from '@/features/auth/useAuthCallback';

export function AuthCallback() {
  const { status, errorMessage, goToLogin, goToDashboard } = useAuthCallback();
  const [showManualFallback, setShowManualFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowManualFallback(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

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

  if (status === 'success') {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-content flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-success-soft/20 flex items-center justify-center text-success mb-3">
            <Icon name="Check" className="w-6 h-6" />
          </div>
          <p className="auth-loading-subtitle font-medium text-foreground">
            {AUTH_CALLBACK.SUCCESS_TEXT}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-content">
        <div className="auth-spinner spin-icon w-10 h-10 border-[3px] border-current/20 border-t-current rounded-full" />
        <p className="auth-loading-subtitle">{AUTH_CALLBACK.LOADING_TEXT}</p>

        {showManualFallback && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              className="auth-submit-btn text-xs py-2 px-4"
              onClick={goToDashboard}
            >
              {AUTH_CALLBACK.GO_TO_DASHBOARD}
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              onClick={goToLogin}
            >
              {AUTH_CALLBACK.BACK_TO_LOGIN}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
