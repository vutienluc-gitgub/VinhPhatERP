import { useAuth } from './AuthProvider'
import { LoginForm } from './LoginForm'

export function AuthPage() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Đang kiểm tra phiên đăng nhập…</p>
      </div>
    )
  }

  if (session) {
    return (
      <div className="auth-logged-in">
        <p className="eyebrow">Đã đăng nhập</p>
        <h2>Xin chào, {session.user.email}</h2>
        <p>Bạn đã đăng nhập thành công.</p>
        <SignOutButton />
      </div>
    )
  }

  return (
    <div className="auth-page">
      <LoginForm />
    </div>
  )
}

function SignOutButton() {
  const { signOut } = useAuth()
  return (
    <button type="button" className="primary-button" onClick={signOut}>
      Đăng xuất
    </button>
  )
}