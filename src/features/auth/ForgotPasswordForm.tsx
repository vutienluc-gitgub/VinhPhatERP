import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Turnstile } from '@/shared/components/Turnstile';

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    if (!captchaToken) {
      setServerError('Vui lòng hoàn thành xác thực bảo mật.');
      return;
    }
    setServerError(null);
    const { error } = await forgotPassword(values.email, captchaToken);
    if (error) {
      setServerError(vietnameseAuthError(error.message));
      // Reset Turnstile on error
      window.turnstile?.reset();
      setCaptchaToken(null);
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
        <p className="auth-status-body text-center text-white/70">
          Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
        </p>
        <button type="button" className="auth-submit-btn mt-6" onClick={onBack}>
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
      <p className="auth-subtitle text-center mb-6 text-[0.85rem] text-white/60">
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

      <Turnstile onVerify={setCaptchaToken} />

      <button
        type="submit"
        className="auth-submit-btn mt-4"
        disabled={isSubmitting || !captchaToken}
      >
        {isSubmitting ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu'}
      </button>

      <button
        type="button"
        className="auth-submit-btn mt-3 bg-transparent border border-white/20 shadow-none"
        onClick={onBack}
      >
        Quay lại
      </button>
    </form>
  );
}

function vietnameseAuthError(message: string): string {
  if (/user not found/i.test(message))
    return 'Email không tồnate hoặc chưa đăng ký.';
  if (/captcha/i.test(message))
    return 'Xác thực bảo mật không thành công. Vui lòng thử lại.';
  if (/too many requests/i.test(message))
    return 'Thao tác quá nhanh. Vui lòng thử lại sau vài phút.';
  if (/network/i.test(message)) return 'Lỗi kết nối mạng.';
  return message;
}
