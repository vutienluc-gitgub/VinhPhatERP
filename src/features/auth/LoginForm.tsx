import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { hasSupabaseEnv } from '@/services/supabase/client';
import { Turnstile } from '@/shared/components/Turnstile';
import { Button } from '@/shared/components/Button';

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
      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl text-center">
        <p className="text-amber-500 font-semibold text-sm uppercase tracking-wider mb-2">
          Cấu hình chưa đủ
        </p>
        <h2 className="text-xl font-bold text-white mb-4">
          Chưa có thông tin Supabase
        </h2>
        <p className="text-white/70 text-sm leading-relaxed">
          Tạo file{' '}
          <code className="px-1.5 py-0.5 bg-black/30 rounded text-amber-400">
            .env.local
          </code>{' '}
          và điền{' '}
          <code className="px-1.5 py-0.5 bg-black/30 rounded text-amber-400">
            VITE_SUPABASE_URL
          </code>{' '}
          và{' '}
          <code className="px-1.5 py-0.5 bg-black/30 rounded text-amber-400">
            VITE_SUPABASE_ANON_KEY
          </code>{' '}
          từ trang Supabase Project Settings.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="text-center mb-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Chào mừng trở lại
        </h2>
        <p className="text-white/50 text-sm">Vui lòng đăng nhập để tiếp tục</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-white/80 ml-1"
          >
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@vinhphat.vn"
              aria-invalid={Boolean(errors.email)}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all duration-200"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <span className="text-rose-400 text-xs ml-1 font-medium">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-white/80 ml-1"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all duration-200"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <span className="text-rose-400 text-xs ml-1 font-medium">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              className="w-4 h-4 rounded border-white/20 bg-black/20 text-[#6366f1] focus:ring-[#6366f1] focus:ring-offset-0 transition-all cursor-pointer"
              {...register('rememberMe')}
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-white/70 cursor-pointer select-none"
            >
              Ghi nhớ
            </label>
          </div>

          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[#818cf8] hover:text-white text-sm font-medium transition-colors"
            >
              Quên mật khẩu?
            </button>
          )}
        </div>
      </div>

      {serverError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
          <p className="text-rose-400 text-sm font-medium">{serverError}</p>
        </div>
      )}

      <div className="flex items-center gap-4 my-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          Hoặc
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
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
        Tiếp tục với Google
      </button>

      <div className="flex justify-center min-h-[65px]">
        <Turnstile onVerify={setCaptchaToken} />
      </div>

      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={isSubmitting || !captchaToken}
        isLoading={isSubmitting}
        className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#818cf8] hover:to-[#6366f1] border-none shadow-lg shadow-[#6366f1]/30 text-white font-bold py-3.5"
      >
        {isSubmitting ? 'Đang xác thực…' : 'Đăng nhập vào hệ thống'}
      </Button>
    </form>
  );
}

function vietnameseAuthError(message: string): string {
  if (/invalid login credentials/i.test(message))
    return 'Email hoặc mật khẩu không đúng.';
  if (/email not confirmed/i.test(message))
    return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.';
  if (/too many requests/i.test(message))
    return 'Đăng nhập thất bại. Vui lòng thử lại sau.';
  if (/network/i.test(message))
    return 'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.';
  return message;
}
