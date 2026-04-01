import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, ilike, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client.js'
import { customers } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = new Hono()

const customerSchema = z.object({
  code:          z.string().min(1).max(50),
  name:          z.string().min(1).max(200),
  phone:         z.string().optional(),
  email:         z.string().email().optional().or(z.literal('')),
  address:       z.string().optional(),
  taxCode:       z.string().optional(),
  contactPerson: z.string().optional(),
  source:        z.enum(['referral', 'exhibition', 'zalo', 'online', 'direct', 'cold_call', 'other']).default('other'),
  notes:         z.string().optional(),
  status:        z.enum(['active', 'inactive']).default('active'),
})

// GET /customers — list with search + filter
router.get('/', requireAuth, async (c) => {
  const { q, status, page = '1', limit = '20' } = c.req.query()
  const offset = (Number(page) - 1) * Number(limit)

  const conditions = []
  if (status) conditions.push(eq(customers.status, status as 'active' | 'inactive'))
  if (q)      conditions.push(ilike(customers.name, `%${q}%`))

  const rows = await db
    .select()
    .from(customers)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(Number(limit))
    .offset(offset)
    .orderBy(customers.name)

  return c.json({ data: rows })
})

// GET /customers/:id
router.get('/:id', requireAuth, async (c) => {
  const { id } = c.req.param()
  const [row] = await db.select().from(customers).where(eq(customers.id, id))
  if (!row) return c.json({ error: 'Không tìm thấy khách hàng' }, 404)
  return c.json({ data: row })
})

// POST /customers
router.post('/', requireAuth, zValidator('json', customerSchema), async (c) => {
  const body = c.req.valid('json')
  const [created] = await db.insert(customers).values(body).returning()
  return c.json({ data: created }, 201)
})

// PATCH /customers/:id
router.patch('/:id', requireAuth, zValidator('json', customerSchema.partial()), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const [updated] = await db
    .update(customers)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning()
  if (!updated) return c.json({ error: 'Không tìm thấy khách hàng' }, 404)
  return c.json({ data: updated })
})

// DELETE /customers/:id — soft delete (set inactive)
router.delete('/:id', requireAuth, async (c) => {
  const { id } = c.req.param()
  const [updated] = await db
    .update(customers)
    .set({ status: 'inactive', updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning()
  if (!updated) return c.json({ error: 'Không tìm thấy khách hàng' }, 404)
  return c.json({ data: updated })
})

export default router
