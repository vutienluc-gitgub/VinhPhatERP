import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import customersRouter from './routes/customers.js';
import notificationsRouter from './routes/notifications.js';
import ordersRouter from './routes/orders.js';
import suppliersRouter from './routes/suppliers.js';
import webhooksRouter from './routes/webhooks.js';
import yarnReceiptsRouter from './routes/yarn-receipts.js';

const app = new Hono();

// ──────────────────────────────────────────────
// Global middleware
// ──────────────────────────────────────────────
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', prettyJSON());

// CORS — Cấu hình phòng thủ chuẩn cho Web, Mobile PWA & WebView Origins
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost',
  'capacitor://localhost',
];

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envOrigins]),
);

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0];
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-Client-Info',
      'apikey',
      'Prefer',
      'X-Requested-With',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 86400, // Cache Preflight OPTIONS response for 24 hours
  }),
);

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    ts: new Date().toISOString(),
  }),
);

// ──────────────────────────────────────────────
// API routes — v1
// ──────────────────────────────────────────────
const api = new Hono();
api.route('/customers', customersRouter);
api.route('/suppliers', suppliersRouter);
api.route('/orders', ordersRouter);
api.route('/webhooks', webhooksRouter);
api.route('/notifications', notificationsRouter);
api.route('/yarn-receipts', yarnReceiptsRouter);

app.route('/api/v1', api);

// ──────────────────────────────────────────────
// 404 fallback
// ──────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Route not found' }, 404));
app.onError((err, c) => {
  console.error('[Server error]', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// ──────────────────────────────────────────────
// Start Background Daemons
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3001);
// eslint-disable-next-line no-console
console.log(`[VinhPhat API] Server listening on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
