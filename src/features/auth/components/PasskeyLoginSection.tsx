import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
import { AUTH_LABELS, AUTH_MESSAGES } from '@/features/auth/constants';
import { Icon } from '@/shared/components/Icon';

export function PasskeyLoginSection({
  onAuthError,
}: {
  onAuthError?: (err: string | null) => void;
}) {
  const { signInWithPasskey } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handlePasskeyLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setIsLoading(true);
        setLocalError(null);
        onAuthError?.(null);
        await signInWithPasskey(identifier.trim() || undefined);
        navigate('/dashboard');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setLocalError(msg);
        onAuthError?.(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [identifier, signInWithPasskey, navigate, onAuthError],
  );

  return (
    <form onSubmit={handlePasskeyLogin} className="space-y-3">
      <div className="relative">
        <input
          type="text"
          id="passkey-identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={AUTH_LABELS.passkeyIdentifierPlaceholder}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-foreground/20 border border-transparent/10 rounded-xl text-on-dark-foreground placeholder:text-on-dark-foreground/40 text-sm focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#818cf8] hover:to-[#6366f1] border-none shadow-lg shadow-[#6366f1]/30 text-on-dark-foreground font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <Icon name="LoaderCircle" size={18} className="animate-spin" />
        ) : (
          <Icon
            name="Fingerprint"
            size={20}
            className="text-[#a5b4fc] animate-pulse"
          />
        )}
        <span>
          {isLoading
            ? AUTH_MESSAGES.passkeyConnecting
            : AUTH_MESSAGES.passkeyLoginAction}
        </span>
      </button>

      {localError && (
        <div className="p-2.5 bg-danger-soft/10 border border-danger/20 rounded-xl text-center">
          <p className="text-danger text-xs font-medium">{localError}</p>
        </div>
      )}
    </form>
  );
}
