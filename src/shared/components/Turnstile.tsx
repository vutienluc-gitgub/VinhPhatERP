import React, { useEffect, useRef } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  options?: {
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact' | 'flexible';
    appearance?: 'always' | 'execute' | 'interaction-only';
    execution?: 'render' | 'execute';
  };
}

/* 'flexible' fills the container but Cloudflare floors it at 300px, so a
   narrower auth card (< ~380px inner width) would still overflow. Below this
   breakpoint we fall back to 'compact' (150px), which fits any phone. */
const COMPACT_BREAKPOINT = 400;

function resolveSize(
  size: 'normal' | 'compact' | 'flexible' | undefined,
  viewportWidth: number,
): 'normal' | 'compact' | 'flexible' {
  if (size) return size;
  return viewportWidth < COMPACT_BREAKPOINT ? 'compact' : 'flexible';
}

export const Turnstile: React.FC<TurnstileProps> = ({ onVerify, options }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Tải script nếu chưa tồn tại
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // 2. Render Widget khi container đã sẵn sàng
    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        console.info('Rendering Turnstile widget...');
        const sitekey =
          import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAC8ajj8quYdxkuYv';

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          callback: onVerify,
          theme: options?.theme || 'light',
          size: resolveSize(options?.size, window.innerWidth),
          appearance: options?.appearance,
          execution: options?.execution,
        });
      }
    };

    const timer = setInterval(() => {
      if (window.turnstile) {
        renderWidget();
        clearInterval(timer);
      }
    }, 100);

    return () => {
      clearInterval(timer);
      // The widget is remounted on every failed login (the form bumps a key to
      // replay the shake animation), so drop it from Cloudflare's registry to
      // avoid leaking a hidden widget per attempt.
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, options]);

  return (
    <div
      ref={containerRef}
      className="turnstile-wrapper my-4 flex justify-center w-full max-w-full overflow-hidden"
    />
  );
};

// Định nghĩa kiểu cho Global Window
interface TurnstileInstance {
  render: (
    container: string | HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'compact' | 'flexible';
      appearance?: 'always' | 'execute' | 'interaction-only';
      execution?: 'render' | 'execute';
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile: TurnstileInstance;
  }
}
