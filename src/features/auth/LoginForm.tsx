import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { hasSupabaseEnv } from '@/services/supabase/client';
import { Turnstile } from '@/shared/components/Turnstile';

import {
  authSchema,
  authDefaultValues,
  type AuthFormValues,
} from './auth.module';
import { useAuth } from './AuthProvider';

export function LoginForm({
  onForgotPassword,
}: {
  onForgotPassword?: () => void;
}) {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: authDefaultValues,
  });

  const onSubmit = async (values: AuthFormValues) => {
    if (!captchaToken) {
      setServerError('Vui lòng hoàn thành xác thực bảo mật.');
      return;
    }
    setServerError(null);
    const { error } = await signIn(
      values.email,
      values.password,
      captchaToken ?? undefined,
    );
    if (error) {
      setServerError(vietnameseAuthError(error.message));
      // Reset Turnstile on error
      window.turnstile?.reset();
      setCaptchaToken(null);
      return;
    }
    navigate('/', { replace: true });
  };

  const handleGoogleLogin = async () => {
    try {
      setServerError(null);
      await signInWithGoogle();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Lỗi không xác định';
      setServerError('Không thể kết nối với Google: ' + message);
    }
  };

  if (!hasSupabaseEnv()) {
    return (
      <div className="login-env-warning">
        <p className="eyebrow">Cấu hình chưa đủ</p>
        <h2>Chưa có thông tin Supabase</h2>
        <p>
          Tạo file <code>.env.local</code> và điền{' '}
          <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code>{' '}
          từ trang Supabase Project Settings.
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="auth-header">
        <span className="logo-text">Vinh Phat V2</span>
        <h2>Chào mừng trở lại</h2>
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <div className="input-wrapper">
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@vinhphat.vn"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Mật khẩu</label>
        <div className="input-wrapper">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </div>
        {errors.password && (
          <span className="error-message">{errors.password.message}</span>
        )}
      </div>

      <div
        className="form-group row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <input type="checkbox" id="rememberMe" {...register('rememberMe')} />
          <label
            htmlFor="rememberMe"
            style={{
              margin: 0,
              fontSize: '0.8rem',
            }}
          >
            Ghi nhớ đăng nhập
          </label>
        </div>

        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--primary-color, #4f46e5)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Quên mật khẩu?
          </button>
        )}
      </div>

      {serverError && <p className="form-error-banner">{serverError}</p>}

      <div className="auth-divider">
        <span>Hoặc tiếp tục với</span>
      </div>

      <button
        type="button"
        className="google-auth-btn"
        onClick={handleGoogleLogin}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>Tiếp tục với Google</span>
      </button>

      <Turnstile onVerify={setCaptchaToken} />

      <button
        type="submit"
        className="auth-submit-btn"
        disabled={isSubmitting || !captchaToken}
      >
        {isSubmitting ? 'Đang truy cập…' : 'Đăng nhập'}
      </button>
    </form>
  );
}

function vietnameseAuthError(message: string): string {
  if (/invalid login credentials/i.test(message))
    return 'Email hoặc mật khẩu không đúng.';
  if (/email not confirmed/i.test(message))
    return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.';
  if (/too many requests/i.test(message))
    return 'Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau.';
  if (/network/i.test(message))
    return 'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.';
  return message;
}
