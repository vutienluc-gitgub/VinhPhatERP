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
import aiChatRouter from './routes/ai-chat.js';

const app = new Hono();

// ──────────────────────────────────────────────
// Global middleware
// ──────────────────────────────────────────────
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', prettyJSON());

// CORS — chỉ cho phép origin từ frontend
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173'
).split(',');
app.use(
  '*',
  cors({
    origin: (origin) =>
      allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
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
api.route('/chat', aiChatRouter);
api.route('/ai/chat', aiChatRouter);

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
