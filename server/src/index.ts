import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { prettyJSON } from 'hono/pretty-json'

import customersRouter    from './routes/customers.js'
import suppliersRouter    from './routes/suppliers.js'
import ordersRouter       from './routes/orders.js'

const app = new Hono()

// ──────────────────────────────────────────────
// Global middleware
// ──────────────────────────────────────────────
app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', prettyJSON())

// CORS — chỉ cho phép origin từ frontend
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',')
app.use('*', cors({
  origin: (origin) => allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

// ──────────────────────────────────────────────
// API routes — v1
// ──────────────────────────────────────────────
const api = new Hono()
api.route('/customers',    customersRouter)
api.route('/suppliers',    suppliersRouter)
api.route('/orders',       ordersRouter)

app.route('/api/v1', api)

// ──────────────────────────────────────────────
// 404 fallback
// ──────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Route not found' }, 404))
app.onError((err, c) => {
  console.error('[Server error]', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// ──────────────────────────────────────────────
// Start
// ──────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3000)
console.log(`🚀 VinhPhat API server listening on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
