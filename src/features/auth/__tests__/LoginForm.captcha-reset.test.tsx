import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LoginForm } from '@/features/auth/LoginForm';

const signIn = vi.fn();

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    signIn,
    signInWithGoogle: vi.fn(),
    signInWithPasskey: vi.fn(),
  }),
}));

vi.mock('@/services/supabase/client', () => ({
  hasSupabaseEnv: () => true,
  supabase: {},
}));

// Surface the widget's onVerify callback as a clickable button so the test can
// simulate a solved challenge, mirroring how Cloudflare delivers the token.
vi.mock('@/shared/components/Turnstile', () => ({
  Turnstile: ({ onVerify }: { onVerify: (token: string) => void }) => (
    <button
      type="button"
      data-testid="turnstile-verify"
      onClick={() => onVerify('test-captcha-token')}
    >
      solve
    </button>
  ),
}));

function resetMock() {
  (window as unknown as { turnstile?: { reset: () => void } }).turnstile = {
    reset: vi.fn(),
  };
}

function renderForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );
}

function solveCaptchaAndSubmit() {
  // Turnstile only mounts once the form is focused (interaction-only).
  fireEvent.focus(document.getElementById('email')!);
  fireEvent.change(document.getElementById('email')!, {
    target: { value: 'user@example.com' },
  });
  fireEvent.change(document.getElementById('password')!, {
    target: { value: 'correct-horse-battery' },
  });
  fireEvent.click(screen.getByTestId('turnstile-verify'));
  const submit = screen.getByRole('button', {
    name: /đăng nhập vào hệ thống/i,
  });
  fireEvent.click(submit);
  return submit;
}

describe('LoginForm — captcha reset on failed login', () => {
  beforeEach(() => {
    signIn.mockReset();
    resetMock();
  });

  it('resets Turnstile and clears the token after a failed login', async () => {
    signIn.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    renderForm();
    solveCaptchaAndSubmit();

    // Allow the async submit to settle
    await screen.findByText(/email hoặc mật khẩu không đúng/i);

    const reset = (window as unknown as { turnstile: { reset: () => void } })
      .turnstile.reset;
    expect(reset).toHaveBeenCalled();

    // Token must be cleared so the next attempt requires a fresh challenge
    const submit = screen.getByRole('button', {
      name: /đăng nhập vào hệ thống/i,
    });
    expect(submit).toBeDisabled();
  });

  it('surfaces a captcha error to the user instead of blocking silently', async () => {
    signIn.mockResolvedValue({
      error: { message: 'captcha verification process failed' },
    });

    renderForm();
    solveCaptchaAndSubmit();

    await screen.findByText(/xác thực bảo mật không thành công/i);
  });
});
