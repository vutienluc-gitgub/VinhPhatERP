import { useCallback, useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import { Turnstile } from '@/shared/components/Turnstile';
import { AUTH_MESSAGES } from '@/features/auth/constants';

interface LoginCaptchaFieldProps {
  onVerify: (token: string | null) => void;
}

/**
 * Wraps the Cloudflare widget with the "script blocked" state the raw
 * component cannot express: when the script never loads the submit button
 * stays disabled, so the user must be told why and given a way to retry.
 */
export function LoginCaptchaField({ onVerify }: LoginCaptchaFieldProps) {
  const [unavailable, setUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const markUnavailable = useCallback(() => setUnavailable(true), []);

  const retry = useCallback(() => {
    onVerify(null);
    setUnavailable(false);
    setAttempt((prev) => prev + 1);
  }, [onVerify]);

  return (
    <div className="space-y-2">
      <div className="flex justify-center min-h-[65px]">
        <Turnstile
          key={attempt}
          onVerify={onVerify}
          onUnavailable={markUnavailable}
          options={{
            theme: 'dark',
            appearance: 'interaction-only',
            execution: 'render',
          }}
        />
      </div>

      {unavailable && (
        <div
          role="alert"
          className="flex flex-col gap-2 p-3 bg-danger-soft/10 border border-danger/20 rounded-xl"
        >
          <div className="flex items-start gap-2">
            <Icon
              name="TriangleAlert"
              size={16}
              className="text-danger mt-0.5"
            />
            <div>
              <p className="text-danger text-sm font-medium">
                {AUTH_MESSAGES.captchaUnavailableTitle}
              </p>
              <p className="text-on-dark-foreground/70 text-xs mt-0.5">
                {AUTH_MESSAGES.captchaUnavailableDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={retry}
            className="self-start text-[#818cf8] hover:text-on-dark-foreground text-sm font-medium transition-colors cursor-pointer"
          >
            {AUTH_MESSAGES.captchaRetry}
          </button>
        </div>
      )}
    </div>
  );
}
