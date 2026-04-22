import React, { useEffect, useRef } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  options?: {
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
  };
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
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
          callback: onVerify,
          theme: options?.theme || 'light',
          size: options?.size || 'normal',
        });
      }
    };

    const timer = setInterval(() => {
      if (window.turnstile) {
        renderWidget();
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [onVerify, options]);

  return (
    <div
      ref={containerRef}
      className="turnstile-wrapper my-4 flex justify-center"
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
      size?: 'normal' | 'compact';
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
