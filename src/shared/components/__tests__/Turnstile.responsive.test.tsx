import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { Turnstile } from '@/shared/components/Turnstile';

interface RenderOptions {
  size?: 'normal' | 'compact';
  callback?: (token: string) => void;
}

function installTurnstileMock() {
  const calls: { options: RenderOptions }[] = [];
  const render = vi.fn((_container: HTMLElement, options: RenderOptions) => {
    calls.push({ options });
    return 'widget-id';
  });
  (window as unknown as { turnstile: unknown }).turnstile = {
    render,
    reset: vi.fn(),
    remove: vi.fn(),
  };
  return { render, calls };
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
    writable: true,
  });
}

describe('Turnstile — responsive widget size', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { turnstile?: unknown }).turnstile;
  });

  it('uses compact widget when the viewport is narrower than 400px', async () => {
    const { render: renderSpy, calls } = installTurnstileMock();
    setViewportWidth(375);

    render(<Turnstile onVerify={vi.fn()} />);
    await vi.advanceTimersByTimeAsync(150);

    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(calls[0]!.options.size).toBe('compact');
  });

  it('uses normal widget on desktop-width viewports', async () => {
    const { render: renderSpy, calls } = installTurnstileMock();
    setViewportWidth(1024);

    render(<Turnstile onVerify={vi.fn()} />);
    await vi.advanceTimersByTimeAsync(150);

    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(calls[0]!.options.size).toBe('normal');
  });

  it('honours an explicit size override regardless of viewport', async () => {
    const { calls } = installTurnstileMock();
    setViewportWidth(375);

    render(<Turnstile onVerify={vi.fn()} options={{ size: 'normal' }} />);
    await vi.advanceTimersByTimeAsync(150);

    expect(calls[0]!.options.size).toBe('normal');
  });
});
