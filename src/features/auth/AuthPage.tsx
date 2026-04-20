import { useState } from 'react';

import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';

import { useAuth } from './AuthProvider';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

import '@/styles/auth.css'; // Keep it for specific overrides if needed, or we can progressively remove classes

export function AuthPage() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(
    'login',
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-white/60 font-medium">
            Đang kiểm tra phiên đăng nhập…
          </p>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0F19] p-4 text-white">
        <div className="max-w-md w-full bg-surface-strong/10 border border-white/10 p-8 rounded-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <span className="text-primary font-semibold tracking-wider uppercase text-xs mb-2 block">
              Đã đăng nhập
            </span>
            <h2 className="text-2xl font-bold">
              Xin chào, {session.user.email}
            </h2>
          </div>
          <p className="text-center mb-8 text-white/50 text-sm">
            Bạn đã đăng nhập thành công vào hệ thống.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild fullWidth size="lg">
              <a href="/">Vào trang chủ</a>
            </Button>
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#0B0F19] text-white overflow-hidden font-sans">
      {/* ── Left Panel (Branding / Art) ── */}
      <div className="hidden lg:flex w-5/12 xl:w-[45%] relative flex-col justify-between p-12 lg:p-16 border-r border-white/5">
        {/* Background Gradients & Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366f1]/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3b82f6]/20 rounded-full blur-[120px]" />
        </div>

        {/* Top: Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] rounded-xl flex items-center justify-center shadow-lg shadow-[#6366f1]/30">
            <Icon name="Layers" className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            VINH PHAT V3
          </span>
        </div>

        {/* Middle: Value Prop */}
        <div className="relative z-10 max-w-lg mt-auto mb-auto">
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-[1.15]">
            Hệ thống Quản trị <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] to-[#c084fc]">
              Nguồn lực Toàn diện
            </span>
          </h1>
          <p className="text-lg text-white/60 mb-8 max-w-md leading-relaxed">
            Nâng tầm hiệu suất vận hành với thiết kế Premium. Tối ưu, bảo mật,
            thông minh và được thiết kế dành riêng cho bạn.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium tracking-wide text-white/80">
              ⚡ Tốc độ cao
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium tracking-wide text-white/80">
              🔒 Bảo mật SSL
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium tracking-wide text-white/80">
              🚀 Premium UI
            </span>
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/40 font-medium tracking-wide uppercase">
          <span>© 2026 Vinh Phat Enterprise</span>
          <span>Version 3.0.0</span>
        </div>
      </div>

      {/* ── Right Panel (Auth Form) ── */}
      <div className="flex-1 flex flex-col justify-center relative p-6 sm:p-12 lg:px-24">
        {/* Add a subtle glow behind the mobile form */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute top-0 right-0 w-full h-[50%] bg-[#6366f1]/10 blur-[100px]" />
        </div>

        <div className="w-full max-w-[400px] mx-auto relative z-10">
          <div className="lg:hidden mb-12 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] rounded-xl flex items-center justify-center shadow-lg shadow-[#6366f1]/30 mb-4">
              <Icon name="Layers" className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              VINH PHAT V3
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            {mode === 'login' ? (
              <>
                <LoginForm
                  onForgotPassword={() => setMode('forgot-password')}
                />
                <div className="mt-6 text-center text-sm text-white/50">
                  Chưa có tài khoản?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-[#818cf8] hover:text-white font-semibold transition-colors duration-200"
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </>
            ) : mode === 'register' ? (
              <>
                <RegisterForm onSuccess={() => setMode('login')} />
                <div className="mt-6 text-center text-sm text-white/50">
                  Đã có tài khoản?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-[#818cf8] hover:text-white font-semibold transition-colors duration-200"
                  >
                    Đăng nhập
                  </button>
                </div>
              </>
            ) : (
              <ForgotPasswordForm onBack={() => setMode('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Button
      variant="ghost"
      size="lg"
      className="border border-white/20 text-white hover:bg-white/10"
      onClick={signOut}
    >
      Đăng xuất
    </Button>
  );
}
