import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, ilike, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client.js'
import { suppliers } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = new Hono()

const supplierSchema = z.object({
  code:          z.string().min(1).max(50),
  name:          z.string().min(1).max(200),
  category:      z.enum(['yarn', 'dye', 'weaving', 'accessories', 'other']).default('other'),
  phone:         z.string().optional(),
  email:         z.string().email().optional().or(z.literal('')),
  address:       z.string().optional(),
  taxCode:       z.string().optional(),
  contactPerson: z.string().optional(),
  notes:         z.string().optional(),
  status:        z.enum(['active', 'inactive']).default('active'),
})

router.get('/', requireAuth, async (c) => {
  const { q, category, status, page = '1', limit = '20' } = c.req.query()
  const offset = (Number(page) - 1) * Number(limit)
  const conditions = []
  if (status)   conditions.push(eq(suppliers.status, status))
  if (category) conditions.push(eq(suppliers.category, category as 'yarn' | 'dye' | 'weaving' | 'accessories' | 'other'))
  if (q)        conditions.push(ilike(suppliers.name, `%${q}%`))
  const rows = await db
    .select()
    .from(suppliers)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(Number(limit))
    .offset(offset)
    .orderBy(suppliers.name)
  return c.json({ data: rows })
})

router.get('/:id', requireAuth, async (c) => {
  const [row] = await db.select().from(suppliers).where(eq(suppliers.id, c.req.param('id')))
  if (!row) return c.json({ error: 'Không tìm thấy nhà cung cấp' }, 404)
  return c.json({ data: row })
})

router.post('/', requireAuth, zValidator('json', supplierSchema), async (c) => {
  const [created] = await db.insert(suppliers).values(c.req.valid('json')).returning()
  return c.json({ data: created }, 201)
})

router.patch('/:id', requireAuth, zValidator('json', supplierSchema.partial()), async (c) => {
  const [updated] = await db
    .update(suppliers)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(eq(suppliers.id, c.req.param('id')))
    .returning()
  if (!updated) return c.json({ error: 'Không tìm thấy nhà cung cấp' }, 404)
  return c.json({ data: updated })
})

router.delete('/:id', requireAuth, async (c) => {
  const [updated] = await db
    .update(suppliers)
    .set({ status: 'inactive', updatedAt: new Date() })
    .where(eq(suppliers.id, c.req.param('id')))
    .returning()
  if (!updated) return c.json({ error: 'Không tìm thấy nhà cung cấp' }, 404)
  return c.json({ data: updated })
})

export default router
