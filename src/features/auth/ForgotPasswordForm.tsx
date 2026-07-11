import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Turnstile } from '@/shared/components/Turnstile';

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from './auth.module';
import { useAuth } from './AuthProvider';
import { AUTH_MESSAGES, AUTH_LABELS } from './constants';
import { vietnameseAuthError } from './utils';

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
      setServerError(AUTH_MESSAGES.captchaRequired);
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
          <h2>{AUTH_MESSAGES.checkEmailTitle}</h2>
        </div>
        <p className="auth-status-body text-center text-white/70">
          {AUTH_MESSAGES.checkEmailBody}
        </p>
        <button type="button" className="auth-submit-btn mt-6" onClick={onBack}>
          {AUTH_MESSAGES.goBack}
        </button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="auth-header">
        <span className="logo-text">vinhphat.app</span>
        <h2>{AUTH_MESSAGES.forgotPasswordTitle}</h2>
      </div>
      <p className="auth-subtitle text-center mb-6 text-[0.85rem] text-white/60">
        {AUTH_MESSAGES.forgotPasswordSubtitle}
      </p>

      <div className="form-group">
        <label htmlFor="forgot-email">{AUTH_LABELS.email}</label>
        <div className="input-wrapper">
          <input
            id="forgot-email"
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

      {serverError && <p className="form-error-banner">{serverError}</p>}

      <Turnstile onVerify={setCaptchaToken} options={{ theme: 'dark' }} />

      <button
        type="submit"
        className="auth-submit-btn mt-4"
        disabled={isSubmitting || !captchaToken}
      >
        {isSubmitting
          ? AUTH_MESSAGES.sendingRequest
          : AUTH_MESSAGES.sendRequest}
      </button>

      <button
        type="button"
        className="auth-submit-btn mt-3 bg-transparent border border-white/20 shadow-none"
        onClick={onBack}
      >
        {AUTH_MESSAGES.goBack}
      </button>
    </form>
  );
}
