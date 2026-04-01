import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'
import type { OrderStatus } from './types'

/* ── Status labels ── */

export const ORDER_STATUSES = ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}

/* ── Zod schemas ── */

export const UNIT_OPTIONS = [
  { value: 'm', label: 'Mét (m)' },
  { value: 'kg', label: 'Kg' },
] as const

export type UnitType = (typeof UNIT_OPTIONS)[number]['value']

export const orderItemSchema = z.object({
  fabricType: z.string().trim().min(2, 'Loại vải tối thiểu 2 ký tự'),
  colorName: z.string().trim().max(120).optional().or(z.literal('')),
  colorCode: z.string().trim().max(20).optional().or(z.literal('')),
  unit: z.enum(['m', 'kg']).default('m'),
  quantity: z.number({ required_error: 'Nhập số lượng' }).positive('Số lượng phải > 0'),
  unitPrice: z.number({ required_error: 'Nhập đơn giá' }).min(0, 'Đơn giá >= 0'),
})

export type OrderItemFormValues = z.infer<typeof orderItemSchema>

export const ordersSchema = z.object({
  orderNumber: z.string().trim().min(3, 'Số đơn hàng tối thiểu 3 ký tự'),
  customerId: z.string().uuid('Chọn khách hàng'),
  orderDate: z.string().trim().min(1, 'Chọn ngày đặt hàng'),
  deliveryDate: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(orderItemSchema).min(1, 'Phải có ít nhất 1 dòng hàng'),
}).refine(
  (data) => {
    if (!data.deliveryDate) return true
    return data.deliveryDate >= data.orderDate
  },
  { message: 'Ngày giao hàng phải sau ngày đặt hàng', path: ['deliveryDate'] },
)

export type OrdersFormValues = z.infer<typeof ordersSchema>

export const emptyOrderItem: OrderItemFormValues = {
  fabricType: '',
  colorName: '',
  colorCode: '',
  unit: 'm',
  quantity: 0,
  unitPrice: 0,
}

export const ordersDefaultValues: OrdersFormValues = {
  orderNumber: '',
  customerId: '',
  orderDate: new Date().toISOString().slice(0, 10),
  deliveryDate: '',
  notes: '',
  items: [{ ...emptyOrderItem }],
}

export const ordersFeature: FeatureDefinition = {
  key: 'orders',
  route: '/orders',
  title: 'Đơn hàng',
  badge: 'Scaffolded',
  description:
    'Order là trung tâm nghiệp vụ của V2, tách rõ header, line items, due date, reservation và shipment downstream.',
  summary: [
    { label: 'Status set', value: '5' },
    { label: 'Shipment mode', value: 'Partial' },
    { label: 'Priority', value: 'Ready' },
  ],
  highlights: [
    'Cho phép giao nhiều lần cho một đơn hàng.',
    'Theo dõi ordered, reserved và shipped qty theo từng dòng.',
    'Filter trễ hạn, sắp đến hạn và theo khách hàng.',
  ],
  resources: [
    'Tao bang orders va order_items.',
    'UI list va detail mobile-first.',
    'Form order voi item repeater va validation.',
  ],
  entities: ['Order header', 'Order item', 'Reservation', 'Due date'],
  nextMilestones: [
    'Tao danh sach order voi state chips.',
    'Them detail page va line editor.',
    'Dong bo voi payments, progress va shipments.',
  ],
}