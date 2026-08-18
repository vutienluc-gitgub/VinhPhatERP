import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';

import { initPlugins } from '@/app/plugins';
import { initIntegration } from '@/integration';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ['localhost', /^https:\/\/vinhphat-erp\.com\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  enabled: import.meta.env.MODE === 'production',
});

import App from './App.tsx';
import '@/styles/global.css';

/**
 * Handle stale deployment chunk errors.
 * When a lazy-loaded page fails because old chunk hashes no longer exist
 * on the server, force one reload to fetch fresh index.html.
 */
window.addEventListener('vite:preloadError', () => {
  const reloadKey = 'erp-chunk-reload';
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, '1');
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('v', Date.now().toString());
    window.location.href = currentUrl.toString();
  }
});

initPlugins().then(() => {
  initIntegration();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
