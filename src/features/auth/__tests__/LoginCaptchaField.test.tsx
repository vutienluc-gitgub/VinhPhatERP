import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { LoginCaptchaField } from '@/features/auth/components/LoginCaptchaField';

describe('LoginCaptchaField — blocked script feedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete (window as unknown as { turnstile?: unknown }).turnstile;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { turnstile?: unknown }).turnstile;
  });

  it('shows no warning while the script is still loading', () => {
    render(<LoginCaptchaField onVerify={vi.fn()} />);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('explains the failure once the script cannot load', async () => {
    render(<LoginCaptchaField onVerify={vi.fn()} />);

    await vi.advanceTimersByTimeAsync(11_000);

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Không tải được xác thực bảo mật')).toBeDefined();
  });

  it('clears the token and hides the warning when retrying', async () => {
    const onVerify = vi.fn();
    render(<LoginCaptchaField onVerify={onVerify} />);
    await vi.advanceTimersByTimeAsync(11_000);

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(onVerify).toHaveBeenCalledWith(null);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
