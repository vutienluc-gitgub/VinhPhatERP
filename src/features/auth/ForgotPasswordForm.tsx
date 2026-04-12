import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from './auth.module';
import { useAuth } from './AuthProvider';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { forgotPassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null);
    const { error } = await forgotPassword(values.email);
    if (error) {
      setServerError(error.message);
      return;
    }
    setIsSent(true);
  };

  if (isSent) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <span className="logo-text">vinhphat.app</span>
          <h2>Kiểm tra hộp thư</h2>
        </div>
        <p
          className="auth-status-body"
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
        </p>
        <button
          type="button"
          className="auth-submit-btn"
          onClick={onBack}
          style={{ marginTop: '1.5rem' }}
        >
          Quay lại đăng nhập
        </button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="auth-header">
        <span className="logo-text">vinhphat.app</span>
        <h2>Quên mật khẩu?</h2>
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
        Nhập email của bạn để nhận liên kết khôi phục mật khẩu.
      </p>

      <div className="form-group">
        <label htmlFor="forgot-email">Email</label>
        <div className="input-wrapper">
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="nhap-email@cua-ban.vn"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>

      {serverError && <p className="form-error-banner">{serverError}</p>}

      <button
        type="submit"
        className="auth-submit-btn"
        disabled={isSubmitting}
        style={{ marginTop: '1rem' }}
      >
        {isSubmitting ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu'}
      </button>

      <button
        type="button"
        className="auth-submit-btn"
        onClick={onBack}
        style={{
          marginTop: '0.75rem',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: 'none',
        }}
      >
        Quay lại
      </button>
    </form>
  );
}
