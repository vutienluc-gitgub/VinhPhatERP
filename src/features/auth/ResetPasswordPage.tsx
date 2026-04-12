import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from './auth.module';
import { useAuth } from './AuthProvider';
import '@/styles/auth.css';

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null);
    const { error } = await resetPassword(values.password);
    if (error) {
      setServerError(error.message);
      return;
    }
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <span className="logo-text">vinhphat.app</span>
            <h2>Mật khẩu đã đổi!</h2>
          </div>
          <p
            className="auth-status-body"
            style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể đăng nhập
            bằng mật khẩu mới ngay bây giờ.
          </p>
          <button
            type="button"
            className="auth-submit-btn"
            onClick={() => navigate('/auth', { replace: true })}
            style={{ marginTop: '1.5rem' }}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <form
          className="auth-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="auth-header">
            <span className="logo-text">vinhphat.app</span>
            <h2>Đặt lại mật khẩu</h2>
          </div>
          <p
            className="auth-subtitle"
            style={{
              textAlign: 'center',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
          </p>

          <div className="form-group">
            <label htmlFor="reset-password">Mật khẩu mới</label>
            <div className="input-wrapper">
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reset-confirm">Xác nhận mật khẩu mới</label>
            <div className="input-wrapper">
              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <span className="error-message">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {serverError && <p className="form-error-banner">{serverError}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
            style={{ marginTop: '1rem' }}
          >
            {isSubmitting ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
