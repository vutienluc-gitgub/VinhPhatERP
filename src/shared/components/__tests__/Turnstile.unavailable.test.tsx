import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { Turnstile } from '@/shared/components/Turnstile';

function clearTurnstile() {
  delete (window as unknown as { turnstile?: unknown }).turnstile;
}

describe('Turnstile — unavailable script', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearTurnstile();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearTurnstile();
  });

  // Regression: the poll ran forever with no error state, so a blocked script
  // left the login submit button disabled with no explanation.
  it('reports unavailability when the Cloudflare script never loads', async () => {
    const onUnavailable = vi.fn();

    render(<Turnstile onVerify={vi.fn()} onUnavailable={onUnavailable} />);

    // Still polling just before the deadline
    await vi.advanceTimersByTimeAsync(9_000);
    expect(onUnavailable).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2_000);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it('does not report unavailability once the script loads', async () => {
    const onUnavailable = vi.fn();
    (window as unknown as { turnstile: unknown }).turnstile = {
      render: vi.fn(() => 'widget-id'),
      reset: vi.fn(),
      remove: vi.fn(),
    };

    render(<Turnstile onVerify={vi.fn()} onUnavailable={onUnavailable} />);
    await vi.advanceTimersByTimeAsync(15_000);

    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it('stops polling after the script is reported unavailable', async () => {
    const onUnavailable = vi.fn();

    render(<Turnstile onVerify={vi.fn()} onUnavailable={onUnavailable} />);
    await vi.advanceTimersByTimeAsync(20_000);

    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });
});
