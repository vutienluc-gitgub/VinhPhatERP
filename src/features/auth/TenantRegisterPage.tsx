import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
  tenantRegisterSchema,
  tenantRegisterDefaults,
} from '@/schema/tenant-register.schema';
import type { TenantRegisterFormValues } from '@/schema/tenant-register.schema';
import { useRegisterTenant } from '@/application/auth';
import '@/styles/auth.css';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function TenantRegisterPage() {
  const {
    register: registerTenant,
    checkSlugAvailable,
    loading,
    error,
  } = useRegisterTenant();
  const [isDone, setIsDone] = useState(false);
  const [createdSlug, setCreatedSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<TenantRegisterFormValues>({
    resolver: zodResolver(tenantRegisterSchema),
    defaultValues: tenantRegisterDefaults,
  });

  const companyName = useWatch({
    control,
    name: 'companyName',
  });
  const slug = useWatch({
    control,
    name: 'slug',
  });

  // Auto-generate slug from company name
  useEffect(() => {
    if (companyName) {
      setValue('slug', slugify(companyName), { shouldValidate: true });
    }
  }, [companyName, setValue]);

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    const timeout = setTimeout(async () => {
      const available = await checkSlugAvailable(slug);
      setSlugStatus(available ? 'available' : 'taken');
    }, 500);

    return () => clearTimeout(timeout);
  }, [slug, checkSlugAvailable]);

  const onSubmit = async (values: TenantRegisterFormValues) => {
    const result = await registerTenant(values);
    if (result.success && result.tenantSlug) {
      setCreatedSlug(result.tenantSlug);
      setIsDone(true);
    }
  };

  if (isDone) {
    const targetUrl =
      window.location.hostname === 'localhost'
        ? `${window.location.origin}?tenant=${createdSlug}`
        : `https://${createdSlug}.vinhphat.app`;

    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <span className="logo-text">vinhphat.app</span>
            <h2>Tao workspace thanh cong!</h2>
          </div>
          <p className="register-success-msg">
            Workspace <strong>{createdSlug}.vinhphat.app</strong> da san sang.
            Kiem tra email de xac nhan tai khoan, sau do dang nhap tai:
          </p>
          <a href={targetUrl} className="auth-submit-btn register-go-btn">
            Vao workspace cua ban
          </a>
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
            <h2>Tao workspace moi</h2>
          </div>

          <p className="register-subtitle">
            Dung thu mien phi 14 ngay. Khong can the tin dung.
          </p>

          {/* Company Name */}
          <div className="form-group">
            <label htmlFor="tenant-company">Ten cong ty</label>
            <div className="input-wrapper">
              <input
                id="tenant-company"
                type="text"
                autoComplete="organization"
                placeholder="Công ty TNHH ABC"
                {...register('companyName')}
              />
            </div>
            {errors.companyName && (
              <span className="error-message">
                {errors.companyName.message}
              </span>
            )}
          </div>

          {/* Slug */}
          <div className="form-group">
            <label htmlFor="tenant-slug">Subdomain</label>
            <div className="input-wrapper">
              <input
                id="tenant-slug"
                type="text"
                placeholder="cong-ty-abc"
                {...register('slug')}
              />
            </div>
            <div className="slug-preview">
              <span className="slug-domain">{slug || '...'}.vinhphat.app</span>
              {slugStatus === 'checking' && (
                <span className="slug-checking">Dang kiem tra...</span>
              )}
              {slugStatus === 'available' && (
                <span className="slug-available">San sang su dung</span>
              )}
              {slugStatus === 'taken' && (
                <span className="slug-taken">Da duoc su dung</span>
              )}
            </div>
            {errors.slug && (
              <span className="error-message">{errors.slug.message}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="tenant-email">Email quan tri</label>
            <div className="input-wrapper">
              <input
                id="tenant-email"
                type="email"
                autoComplete="email"
                placeholder="admin@congty.vn"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="tenant-phone">So dien thoai (tuy chon)</label>
            <div className="input-wrapper">
              <input
                id="tenant-phone"
                type="tel"
                autoComplete="tel"
                placeholder="0912 345 678"
                {...register('phone')}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="tenant-password">Mat khau</label>
            <div className="input-wrapper">
              <input
                id="tenant-password"
                type="password"
                autoComplete="new-password"
                placeholder="Ít nhất 6 ký tự"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="tenant-confirm">Xac nhan mat khau</label>
            <div className="input-wrapper">
              <input
                id="tenant-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <span className="error-message">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {error && <p className="form-error-banner">{error}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || slugStatus === 'taken'}
          >
            {loading ? 'Dang tao workspace...' : 'Tao workspace mien phi'}
          </button>

          <div className="auth-switch">
            Da co tai khoan?
            <a href="/auth">Dang nhap</a>
          </div>
        </form>
      </div>
    </div>
  );
}
