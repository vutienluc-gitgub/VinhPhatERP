import { AUTH_MESSAGES } from '@/features/auth/constants';
import { AuthMotion } from '@/features/auth/motion';

import { GoogleIcon } from './GoogleIcon';

export function GoogleLoginButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface hover:bg-slate-50 text-foreground rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      style={{
        transform: `scale(1)`,
        transition: `transform ${AuthMotion.duration.fast}ms ease`,
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.transform = `scale(${AuthMotion.button.hoverScale})`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseDown={(e) => {
        if (!disabled)
          e.currentTarget.style.transform = `scale(${AuthMotion.button.tapScale})`;
      }}
      onMouseUp={(e) => {
        if (!disabled)
          e.currentTarget.style.transform = `scale(${AuthMotion.button.hoverScale})`;
      }}
    >
      <div className="auth-glow" />
      <GoogleIcon />
      {AUTH_MESSAGES.continueWithGoogle}
    </button>
  );
}
