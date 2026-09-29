import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/shared/components/Icon';

import {
  authSchema,
  authDefaultValues,
  type AuthFormValues,
} from './auth.module';
import { useAuth } from './AuthProvider';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { LoginCaptchaField } from './components/LoginCaptchaField';
import { PasskeyLoginSection } from './components/PasskeyLoginSection';
import { AUTH_MESSAGES, AUTH_LABELS } from './constants';
import { vietnameseAuthError } from './utils';

/* -- Shared Styles -------------------------------------------------- */

const FLOATING_INPUT =
  'peer w-full px-4 pt-5 pb-2 bg-foreground/15 border border-transparent/15 rounded-xl text-on-dark-foreground placeholder-transparent focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] focus:bg-foreground/25 transition-all duration-200';

const FLOATING_LABEL =
  'absolute left-4 top-1/2 -translate-y-1/2 text-on-dark-foreground/75 text-sm pointer-events-none transition-all duration-200 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-on-dark-foreground/90 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-on-dark-foreground/90';

/* -- Component ------------------------------------------------------ */

export function LoginForm({
  onForgotPassword,
}: {
  onForgotPassword?: () => void;
}) {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'passkey' | 'password'>('password');
  const [serverError, setServerError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: authDefaultValues,
  });

  const activateTurnstile = useCallback(() => {
    setIsInteracting(true);
  }, []);

  const handlePasswordKeyEvent = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      setIsCapsLock(e.getModifierState('CapsLock'));
    },
    [],
  );

  const onSubmit = async (values: AuthFormValues) => {
    setServerError(null);
    try {
      const { error } = await signIn(
        values.email,
        values.password,
        captchaToken ?? undefined,
        values.rememberMe,
      );
      if (error) {
        setServerError(vietnameseAuthError(error.message));
        // Cloudflare tokens are single-use: a failure (wrong password, or the
        // challenge itself rejected) leaves the widget solved but the token
        // spent, so the submit button stays enabled with a dead token and every
        // retry fails silently. Reset so the next attempt gets a fresh one.
        window.turnstile?.reset();
        setCaptchaToken(null);
        setShakeKey((prev) => prev + 1);
        return;
      }
      navigate('/dashboard');
    } catch {
      setServerError(AUTH_MESSAGES.errorUnknown);
      setShakeKey((prev) => prev + 1);
    }
  };

  const handleGoogleLogin = async () => {
    setServerError(null);
    try {
      await signInWithGoogle();
    } catch {
      setServerError(AUTH_MESSAGES.errorUnknown);
    }
  };

  const isLocked = isSubmitting;

  return (
    <div
      key={shakeKey}
      className={`space-y-4 ${serverError ? 'auth-shake' : ''}`}
    >
      {/* -- Tabs Dual-Stack (Passkey / M?t kh?u) --------------- */}
      <div
        role="tablist"
        aria-label={AUTH_LABELS.authMethodTabList}
        className="flex p-0.5 sm:p-1 bg-foreground/10 rounded-xl border border-transparent/10"
      >
        <button
          role="tab"
          aria-selected={authMode === 'passkey'}
          type="button"
          onClick={() => {
            setAuthMode('passkey');
            setServerError(null);
          }}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            authMode === 'passkey'
              ? 'bg-[#6366f1] text-on-dark-foreground shadow-md'
              : 'text-on-dark-foreground/60 hover:text-on-dark-foreground'
          }`}
        >
          <Icon
            name="Fingerprint"
            size={16}
            className="shrink-0 max-[359px]:hidden"
          />
          <span className="min-w-0 leading-tight">
            {AUTH_LABELS.passkeyTabPasskey}
          </span>
        </button>
        <button
          role="tab"
          aria-selected={authMode === 'password'}
          type="button"
          onClick={() => {
            setAuthMode('password');
            setServerError(null);
          }}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            authMode === 'password'
              ? 'bg-[#6366f1] text-on-dark-foreground shadow-md'
              : 'text-on-dark-foreground/60 hover:text-on-dark-foreground'
          }`}
        >
          <Icon
            name="KeyRound"
            size={16}
            className="shrink-0 max-[359px]:hidden"
          />
          <span className="min-w-0 leading-tight">
            {AUTH_LABELS.passkeyTabPassword}
          </span>
        </button>
      </div>

      {authMode === 'passkey' ? (
        /* -- Lu?ng Passkey 1 Ch?m -- */
        <PasskeyLoginSection onAuthError={setServerError} />
      ) : (
        /* -- Lu?ng Email / M?t kh?u truy?n th?ng -- */
        <form
          onSubmit={handleSubmit(onSubmit)}
          onFocus={activateTurnstile}
          className="space-y-4"
        >
          <div className="space-y-3">
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
                <span className="text-danger text-xs ml-1 font-medium">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder=" "
                  aria-invalid={Boolean(errors.password)}
                  className={`${FLOATING_INPUT} pr-11`}
                  onKeyUp={handlePasswordKeyEvent}
                  onKeyDown={handlePasswordKeyEvent}
                  {...register('password')}
                />
                <label htmlFor="password" className={FLOATING_LABEL}>
                  {AUTH_LABELS.password}
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={
                    showPassword
                      ? AUTH_LABELS.hidePassword
                      : AUTH_LABELS.showPassword
                  }
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-dark-foreground/60 hover:text-on-dark-foreground p-1 rounded-md transition-colors cursor-pointer"
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>
              {isCapsLock && (
                <div className="auth-caps-warning">
                  <Icon name="TriangleAlert" size={14} />
                  <span>{AUTH_MESSAGES.capsLockWarning}</span>
                </div>
              )}
              {errors.password && (
                <span className="text-danger text-xs ml-1 font-medium">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1">
              <label
                htmlFor="rememberMe"
                className="flex items-center gap-2 min-w-0 min-h-[44px] py-1 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  id="rememberMe"
                  disabled={isLocked}
                  className="w-4 h-4 rounded border-transparent/20 bg-foreground/20 text-[#6366f1] focus:ring-[#6366f1] focus:ring-offset-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  {...register('rememberMe')}
                />
                <span className="text-sm text-on-dark-foreground/75">
                  {AUTH_LABELS.rememberMe}
                </span>
              </label>

              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  disabled={isLocked}
                  className="text-[#818cf8] hover:text-on-dark-foreground text-sm font-medium transition-colors min-h-[44px] py-1 flex items-center text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {AUTH_LABELS.forgotPassword}
                </button>
              )}
            </div>
          </div>

          {/* Turnstile */}
          {isInteracting && <LoginCaptchaField onVerify={setCaptchaToken} />}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLocked || !captchaToken}
            aria-busy={isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#818cf8] hover:to-[#6366f1] border-none shadow-lg shadow-[#6366f1]/30 text-on-dark-foreground font-bold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting && (
              <Icon name="LoaderCircle" size={18} className="animate-spin" />
            )}
            {isSubmitting
              ? AUTH_MESSAGES.authenticating
              : AUTH_MESSAGES.loginButton}
          </button>
        </form>
      )}

      {/* -- Server Error ------------------------------------- */}
      {serverError && (
        <div className="p-3 bg-danger-soft/10 border border-danger/20 rounded-xl text-center">
          <p className="text-danger text-sm font-medium">{serverError}</p>
        </div>
      )}

      {/* -- Divider ------------------------------------------ */}
      <div className="flex items-center gap-4 my-1">
        <div className="flex-1 h-px bg-surface/10" />
        <span className="text-xs font-medium text-on-dark-foreground/40 uppercase tracking-wider">
          {AUTH_MESSAGES.or}
        </span>
        <div className="flex-1 h-px bg-surface/10" />
      </div>

      {/* -- Google Button ------------------------------------ */}
      <GoogleLoginButton onClick={handleGoogleLogin} disabled={isLocked} />
    </div>
  );
}
