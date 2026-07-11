import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { hasSupabaseEnv } from '@/services/supabase/client';
import { Turnstile } from '@/shared/components/Turnstile';
import { Icon } from '@/shared/components/Icon';

import {
  authSchema,
  authDefaultValues,
  type AuthFormValues,
} from './auth.module';
import { useAuth } from './AuthProvider';
import { GoogleIcon } from './components/GoogleIcon';
import { AUTH_MESSAGES, AUTH_LABELS } from './constants';
import { AuthMotion } from './motion';
import { vietnameseAuthError } from './utils';

/* ── Shared Styles ───────────────────────────────────────── */

const FLOATING_INPUT =
  'peer w-full px-4 pt-5 pb-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all duration-200';

const FLOATING_LABEL =
  'absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none transition-all duration-200 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-white/80 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-white/80';

/* ── Component ───────────────────────────────────────────── */

export function LoginForm({
  onForgotPassword,
}: {
  onForgotPassword?: () => void;
}) {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: authDefaultValues,
  });

  /* ── Lazy-load Turnstile on any interaction ────────────── */
  const activateTurnstile = useCallback(() => {
    setIsInteracting(true);
  }, []);

  /* ── Caps Lock detection ───────────────────────────────── */
  const handlePasswordKeyEvent = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.getModifierState) {
        setIsCapsLock(e.getModifierState('CapsLock'));
      }
    },
    [],
  );

  /* ── Trigger shake animation ───────────────────────────── */
  const triggerShake = useCallback(() => {
    setShakeKey((prev) => prev + 1);
  }, []);

  /* ── Handlers ──────────────────────────────────────────── */
  const onSubmit = async (values: AuthFormValues) => {
    if (!captchaToken) {
      setServerError(AUTH_MESSAGES.captchaRequired);
      triggerShake();
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
      triggerShake();
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
        error instanceof Error ? error.message : AUTH_MESSAGES.errorUnknown;
      setServerError(AUTH_MESSAGES.googleLoginError + message);
      triggerShake();
    }
  };

  /* ── Missing Env Guard ─────────────────────────────────── */
  if (!hasSupabaseEnv()) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl text-center">
        <p className="text-amber-500 font-semibold text-sm uppercase tracking-wider mb-2">
          {AUTH_MESSAGES.missingEnvTitle}
        </p>
        <h2 className="text-xl font-bold text-white mb-4">
          {AUTH_MESSAGES.missingEnvDesc}
        </h2>
        <p className="text-white/70 text-sm leading-relaxed">
          {AUTH_MESSAGES.missingEnvInstruction}
        </p>
      </div>
    );
  }

  const isLocked = isSubmitting;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit)}
      onMouseEnter={activateTurnstile}
      onFocus={activateTurnstile}
      onTouchStart={activateTurnstile}
      onKeyDown={activateTurnstile}
      noValidate
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="text-center mb-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {AUTH_MESSAGES.welcomeBack}
        </h2>
        <p className="text-white/50 text-sm">{AUTH_MESSAGES.loginToContinue}</p>
      </div>

      {/* ── Form Fields ────────────────────────────────────── */}
      <div
        key={shakeKey}
        className={`flex flex-col gap-5${serverError ? ' auth-shake' : ''}`}
      >
        {/* Email */}
        <div className="flex flex-col gap-1">
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder=" "
              aria-invalid={Boolean(errors.email)}
              className={FLOATING_INPUT}
              {...register('email')}
            />
            <label htmlFor="email" className={FLOATING_LABEL}>
              {AUTH_LABELS.email}
            </label>
          </div>
          {errors.email && (
            <span className="text-rose-400 text-xs ml-1 font-medium">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <div className="relative">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder=" "
              aria-invalid={Boolean(errors.password)}
              className={FLOATING_INPUT}
              onKeyUp={handlePasswordKeyEvent}
              onKeyDown={handlePasswordKeyEvent}
              {...register('password')}
            />
            <label htmlFor="password" className={FLOATING_LABEL}>
              {AUTH_LABELS.password}
            </label>
          </div>
          {isCapsLock && (
            <div className="auth-caps-warning">
              <Icon name="TriangleAlert" size={14} />
              <span>{AUTH_MESSAGES.capsLockWarning}</span>
            </div>
          )}
          {errors.password && (
            <span className="text-rose-400 text-xs ml-1 font-medium">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              disabled={isLocked}
              className="w-4 h-4 rounded border-white/20 bg-black/20 text-[#6366f1] focus:ring-[#6366f1] focus:ring-offset-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              {...register('rememberMe')}
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-white/70 cursor-pointer select-none"
            >
              {AUTH_LABELS.rememberMe}
            </label>
          </div>

          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={isLocked}
              className="text-[#818cf8] hover:text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {AUTH_LABELS.forgotPassword}
            </button>
          )}
        </div>
      </div>

      {/* ── Server Error ───────────────────────────────────── */}
      {serverError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
          <p className="text-rose-400 text-sm font-medium">{serverError}</p>
        </div>
      )}

      {/* ── Divider ────────────────────────────────────────── */}
      <div className="flex items-center gap-4 my-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {AUTH_MESSAGES.or}
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* ── Google Button (with Glow) ──────────────────────── */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLocked}
        className="group relative w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          transform: `scale(1)`,
          transition: `transform ${AuthMotion.duration.fast}ms ease`,
        }}
        onMouseEnter={(e) => {
          if (!isLocked)
            e.currentTarget.style.transform = `scale(${AuthMotion.button.hoverScale})`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          if (!isLocked)
            e.currentTarget.style.transform = `scale(${AuthMotion.button.tapScale})`;
        }}
        onMouseUp={(e) => {
          if (!isLocked)
            e.currentTarget.style.transform = `scale(${AuthMotion.button.hoverScale})`;
        }}
      >
        <div className="auth-glow" />
        <GoogleIcon />
        {AUTH_MESSAGES.continueWithGoogle}
      </button>

      {/* ── Turnstile (Lazy Load) ──────────────────────────── */}
      <div className="flex justify-center min-h-[65px]">
        {isInteracting && (
          <Turnstile onVerify={setCaptchaToken} options={{ theme: 'dark' }} />
        )}
      </div>

      {/* ── Submit Button ──────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLocked || !captchaToken}
        aria-busy={isSubmitting}
        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#818cf8] hover:to-[#6366f1] border-none shadow-lg shadow-[#6366f1]/30 text-white font-bold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting && (
          <Icon name="LoaderCircle" size={18} className="animate-spin" />
        )}
        {isSubmitting
          ? AUTH_MESSAGES.authenticating
          : AUTH_MESSAGES.loginButton}
      </button>
    </form>
  );
}
