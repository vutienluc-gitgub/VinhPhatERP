import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'

import { authSchema, authDefaultValues, type AuthFormValues } from './auth.module'
import { useAuth } from './AuthProvider'
import { hasSupabaseEnv } from '@/services/supabase/client'

export function LoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: authDefaultValues,
  })

  const onSubmit = async (values: AuthFormValues) => {
    setServerError(null)
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setServerError(vietnameseAuthError(error.message))
      return
    }
    navigate('/', { replace: true })
  }

  if (!hasSupabaseEnv()) {
    return (
      <div className="login-env-warning">
        <p className="eyebrow">Cấu hình chưa đủ</p>
        <h2>Chưa có thông tin Supabase</h2>
        <p>
          Tạo file <code>.env.local</code> và điền <code>VITE_SUPABASE_URL</code>{' '}
          và <code>VITE_SUPABASE_ANON_KEY</code> từ trang Supabase Project Settings.
        </p>
      </div>
    )
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
        {errors.email && <span className="error-message">{errors.email.message}</span>}
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
        {errors.password && <span className="error-message">{errors.password.message}</span>}
      </div>

      <div className="form-group row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" id="rememberMe" {...register('rememberMe')} />
        <label htmlFor="rememberMe" style={{ margin: 0, fontSize: '0.8rem' }}>Ghi nhớ đăng nhập</label>
      </div>

      {serverError && <p className="form-error-banner">{serverError}</p>}

      <button
        type="submit"
        className="auth-submit-btn"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Đang truy cập…' : 'Đăng nhập'}
      </button>
    </form>
  )
}

function vietnameseAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Email hoặc mật khẩu không đúng.'
  if (/email not confirmed/i.test(message)) return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.'
  if (/too many requests/i.test(message)) return 'Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau.'
  if (/network/i.test(message)) return 'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.'
  return message
}
