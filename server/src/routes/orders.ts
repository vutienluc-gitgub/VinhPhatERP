import { zValidator } from '@hono/zod-validator';
import { eq, desc, sum } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { db } from '../db/client.js';
import { orders, orderItems, orderProgress } from '../db/schema/index.js';
import { requireAuth } from '../middleware/auth.js';

const PRODUCTION_STAGES = [
  'warping',
  'weaving',
  'greige_check',
  'dyeing',
  'finishing',
  'final_check',
  'packing',
] as const;

type Env = { Variables: { user: { id: string } } };
const router = new Hono<Env>();

const orderItemSchema = z.object({
  fabricType: z.string().min(1),
  colorName: z.string().optional(),
  colorCode: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().default('m'),
  unitPrice: z.number().min(0).default(0),
  notes: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const orderSchema = z.object({
  orderNumber: z.string().min(1),
  customerId: z.string().uuid(),
  orderDate: z.string(),
  deliveryDate: z.string().optional(),
  status: z
    .enum(['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    .default('draft'),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

// GET /orders
router.get('/', requireAuth, async (c) => {
  const { status, customerId, page = '1', limit = '20' } = c.req.query();
  const offset = (Number(page) - 1) * Number(limit);
  let query = db.select().from(orders).$dynamic();
  if (status)
    query = query.where(
      eq(orders.status, status as typeof orders.status._.data),
    );
  if (customerId) query = query.where(eq(orders.customerId, customerId));
  const rows = await query
    .orderBy(desc(orders.orderDate))
    .limit(Number(limit))
    .offset(offset);
  return c.json({ data: rows });
});

// GET /orders/:id — với items
router.get('/:id', requireAuth, async (c) => {
  const { id } = c.req.param();
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404);
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));
  const progress = await db
    .select()
    .from(orderProgress)
    .where(eq(orderProgress.orderId, id));
  return c.json({
    data: {
      ...order,
      items,
      progress,
    },
  });
});

// POST /orders — tạo đơn + items trong transaction
router.post('/', requireAuth, zValidator('json', orderSchema), async (c) => {
  const user = c.get('user') as { id: string };
  const { items, ...orderData } = c.req.valid('json');

  const result = await db.transaction(async (tx) => {
    const [newOrder] = await tx
      .insert(orders)
      .values({
        ...orderData,
        createdBy: user.id,
      })
      .returning();

    const newItems = await tx
      .insert(orderItems)
      .values(
        items.map((i) => ({
          ...i,
          orderId: newOrder.id,
          quantity: String(i.quantity),
          unitPrice: String(i.unitPrice),
        })),
      )
      .returning();

    return {
      ...newOrder,
      items: newItems,
    };
  });

  return c.json({ data: result }, 201);
});

// PATCH /orders/:id — cập nhật status/notes
router.patch(
  '/:id',
  requireAuth,
  zValidator('json', orderSchema.partial().omit({ items: true })),
  async (c) => {
    const { id } = c.req.param();
    const [updated] = await db
      .update(orders)
      .set({
        ...c.req.valid('json'),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    if (!updated) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404);
    return c.json({ data: updated });
  },
);

// POST /orders/:id/confirm — xác nhận đơn: tính lại tổng, đổi trạng thái, tạo 7 công đoạn
router.post('/:id/confirm', requireAuth, async (c) => {
  const user = c.get('user') as { id: string };
  const { id } = c.req.param();

  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404);
  if (existing.status !== 'draft') {
    return c.json({ error: 'Chỉ có thể xác nhận đơn ở trạng thái nháp' }, 422);
  }

  const result = await db.transaction(async (tx) => {
    // Tính lại tổng tiền từ items
    const [totalsRow] = await tx
      .select({ total: sum(orderItems.amount) })
      .from(orderItems)
      .where(eq(orderItems.orderId, id));
    const newTotal = totalsRow?.total ?? '0';

    // Cập nhật đơn
    const [confirmed] = await tx
      .update(orders)
      .set({
        status: 'confirmed',
        totalAmount: newTotal,
        confirmedBy: user.id,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    // Tạo 7 dòng tiến độ
    await tx.insert(orderProgress).values(
      PRODUCTION_STAGES.map((stage) => ({
        orderId: id,
        stage,
        status: 'pending' as const,
      })),
    );

    return confirmed;
  });

  return c.json({ data: result });
});

export default router;
