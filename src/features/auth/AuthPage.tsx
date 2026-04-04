import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import '@/styles/auth.css'

export function AuthPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Đang kiểm tra phiên đăng nhập…</p>
      </div>
    )
  }

  if (session) {
    return (
      <div className="auth-logged-in">
        <div className="auth-container">
          <div className="auth-header">
            <span className="logo-text">Đã đăng nhập</span>
            <h2>Xin chào, {session.user.email}</h2>
          </div>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)' }}>
            Bạn đã đăng nhập thành công vào hệ thống.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="/" className="auth-submit-btn" style={{ textDecoration: 'none', padding: '0.8rem 2rem' }}>Vào trang chủ</a>
            <SignOutButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {mode === 'login' ? (
          <>
            <LoginForm />
            <div className="auth-switch">
              Chưa có tài khoản? 
              <button onClick={() => setMode('register')}>Đăng ký ngay</button>
            </div>
          </>
        ) : (
          <>
            <RegisterForm onSuccess={() => setMode('login')} />
            <div className="auth-switch">
              Đã có tài khoản? 
              <button onClick={() => setMode('login')}>Đăng nhập</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SignOutButton() {
  const { signOut } = useAuth()
  return (
    <button 
      type="button" 
      className="auth-submit-btn" 
      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'none' }}
      onClick={signOut}
    >
      Đăng xuất
    </button>
  )
}