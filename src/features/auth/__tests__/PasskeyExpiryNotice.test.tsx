import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { PasskeyExpiryNotice } from '@/features/auth/components/PasskeyExpiryNotice';
import { PASSKEY_NO_REFRESH_TOKEN } from '@/shared/lib/session-kind';

const signOut = vi.fn();
const toastError = vi.fn();

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    session: mockSession,
    signOut,
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

let mockSession: unknown = null;

function passkeySession(expiresInSeconds: number) {
  return {
    access_token: 'header.payload.sig',
    refresh_token: PASSKEY_NO_REFRESH_TOKEN,
    user: { app_metadata: { provider: 'passkey' } },
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
}

describe('PasskeyExpiryNotice', () => {
  beforeEach(() => {
    signOut.mockReset();
    signOut.mockResolvedValue(undefined);
    toastError.mockReset();
    vi.useFakeTimers();
    mockSession = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing for a normal (non-passkey) session', () => {
    mockSession = {
      access_token: 'header.payload.sig',
      refresh_token: 'real-refresh',
      user: { app_metadata: { provider: 'email' } },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    render(<PasskeyExpiryNotice />);
    vi.runAllTimers();
    expect(toastError).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('notifies and signs out immediately when the session is already expired', () => {
    mockSession = passkeySession(-10);
    render(<PasskeyExpiryNotice />);
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/hết hạn/i),
      expect.objectContaining({ id: 'passkey-session-expired' }),
    );
    expect(signOut).toHaveBeenCalled();
  });

  it('defers until expiry then notifies and signs out', () => {
    mockSession = passkeySession(120);
    render(<PasskeyExpiryNotice />);

    vi.advanceTimersByTime(119_000);
    expect(toastError).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    expect(toastError).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalled();
  });

  it('clears the timer on unmount', () => {
    mockSession = passkeySession(120);
    const { unmount } = render(<PasskeyExpiryNotice />);
    unmount();
    vi.runAllTimers();
    expect(signOut).not.toHaveBeenCalled();
  });
});
