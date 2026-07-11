import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { hasSupabaseEnv } from '@/services/supabase/client';
import { Turnstile } from '@/shared/components/Turnstile';

import {
  registerSchema,
  registerDefaultValues,
  type RegisterFormValues,
} from './auth.module';
import { useAuth } from './AuthProvider';
import { AUTH_MESSAGES, AUTH_LABELS } from './constants';
import { vietnameseAuthError } from './utils';

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaultValues,
  });

  const onSubmit = async (values: RegisterFormValues) => {
    if (!captchaToken) {
      setServerError(AUTH_MESSAGES.captchaRequired);
      return;
    }
    setServerError(null);
    const { error } = await signUp(values.email, values.password, captchaToken);

    if (error) {
      setServerError(vietnameseAuthError(error.message));
      // Reset Turnstile on error
      window.turnstile?.reset();
      setCaptchaToken(null);
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
        <p className="logo-text">{AUTH_MESSAGES.missingEnvTitle}</p>
        <h2>{AUTH_MESSAGES.missingEnvDesc}</h2>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <span className="logo-text">Vinh Phat ERP</span>
          <h2>{AUTH_MESSAGES.registerSuccessTitle}</h2>
        </div>
        <p className="text-center text-white/70">
          {AUTH_MESSAGES.registerSuccessBody}
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="auth-header">
        <span className="logo-text">Vinh Phat ERP</span>
        <h2>{AUTH_MESSAGES.createAccount}</h2>
      </div>

      <div className="form-group">
        <label htmlFor="reg-email">{AUTH_LABELS.email}</label>
        <div className="input-wrapper">
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder={AUTH_LABELS.emailPlaceholder}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="reg-password">{AUTH_LABELS.password}</label>
        <div className="input-wrapper">
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            placeholder={AUTH_LABELS.passwordPlaceholder}
            {...register('password')}
          />
        </div>
        {errors.password && (
          <span className="error-message">{errors.password.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="reg-confirm">{AUTH_LABELS.confirmPassword}</label>
        <div className="input-wrapper">
          <input
            id="reg-confirm"
            type="password"
            autoComplete="new-password"
            placeholder={AUTH_LABELS.passwordPlaceholder}
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

      <Turnstile onVerify={setCaptchaToken} options={{ theme: 'dark' }} />

      <button
        type="submit"
        className="auth-submit-btn"
        disabled={isSubmitting || !captchaToken}
      >
        {isSubmitting ? AUTH_MESSAGES.processing : AUTH_MESSAGES.registerNow}
      </button>
    </form>
  );
}
