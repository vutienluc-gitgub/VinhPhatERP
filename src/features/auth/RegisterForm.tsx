import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { hasSupabaseEnv } from '@/services/supabase/client';

import {
  registerSchema,
  registerDefaultValues,
  type RegisterFormValues,
} from './auth.module';
import { useAuth } from './AuthProvider';

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaultValues,
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    const { error } = await signUp(values.email, values.password);

    if (error) {
      setServerError(vietnameseAuthError(error.message));
      return;
    }

    setIsDone(true);
    setTimeout(() => {
      onSuccess();
    }, 3000);
  };

  if (!hasSupabaseEnv()) {
    return (
      <div className="login-env-warning">
        <p className="logo-text">Cấu hình chưa đủ</p>
        <h2>Chưa có thông tin Supabase</h2>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <span className="logo-text">Vinh Phat ERP</span>
          <h2>Đăng ký thành công!</h2>
        </div>
        <p
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.
          Đang chuyển hướng về trang đăng nhập...
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="auth-header">
        <span className="logo-text">Vinh Phat ERP</span>
        <h2>Tạo tài khoản</h2>
      </div>

      <div className="form-group">
        <label htmlFor="reg-email">Email</label>
        <div className="input-wrapper">
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="your-email@example.com"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="reg-password">Mật khẩu</label>
        <div className="input-wrapper">
          <input
            id="reg-password"
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
        <label htmlFor="reg-confirm">Xác nhận mật khẩu</label>
        <div className="input-wrapper">
          <input
            id="reg-confirm"
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

      <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Đang xử lý…' : 'Đăng ký ngay'}
      </button>
    </form>
  );
}

function vietnameseAuthError(message: string): string {
  if (/user already registered/i.test(message))
    return 'Email này đã được đăng ký.';
  if (/network/i.test(message)) return 'Lỗi kết nối mạng.';
  return message;
}
