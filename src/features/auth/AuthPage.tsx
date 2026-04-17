import { useState } from 'react';

import { useAuth } from './AuthProvider';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import '@/styles/auth.css';

export function AuthPage() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(
    'login',
  );

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="auth-logged-in">
        <div className="auth-container">
          <div className="auth-header">
            <span className="logo-text">Đã đăng nhập</span>
            <h2>Xin chào, {session.user.email}</h2>
          </div>
          <p className="text-center mb-8 text-white/70">
            Bạn đã đăng nhập thành công vào hệ thống.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/"
              className="auth-submit-btn no-underline px-8 py-[0.8rem]"
            >
              Vào trang chủ
            </a>
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {mode === 'login' ? (
          <>
            <LoginForm onForgotPassword={() => setMode('forgot-password')} />
            <div className="auth-switch">
              Chưa có tài khoản?
              <button onClick={() => setMode('register')}>Đăng ký ngay</button>
            </div>
          </>
        ) : mode === 'register' ? (
          <>
            <RegisterForm onSuccess={() => setMode('login')} />
            <div className="auth-switch">
              Đã có tài khoản?
              <button onClick={() => setMode('login')}>Đăng nhập</button>
            </div>
          </>
        ) : (
          <ForgotPasswordForm onBack={() => setMode('login')} />
        )}
      </div>
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <button
      type="button"
      className="auth-submit-btn bg-transparent border border-white/20 shadow-none"
      onClick={signOut}
    >
      Đăng xuất
    </button>
  );
}
