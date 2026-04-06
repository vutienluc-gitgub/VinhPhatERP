import { z } from 'zod'

/* ── Types ── */

export type OrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export type OrderItem = {
  id: string
  order_id: string
  fabric_type: string
  color_name: string | null
  color_code: string | null
  width_cm: number | null
  quantity: number
  unit: string
  unit_price: number
  amount: number
  notes: string | null
  sort_order: number
}

export type Order = {
  id: string
  order_number: string
  customer_id: string
  order_date: string
  delivery_date: string | null
  total_amount: number
  paid_amount: number
  source_quotation_id: string | null
  status: OrderStatus
  notes: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  customers?: { name: string; code: string } | null
  quotations?: { quotation_number: string } | null
  order_items?: OrderItem[]
}

export type OrdersFilter = {
  search?: string
  status?: OrderStatus
  customerId?: string
}

/* ── Configs & Labels ── */

export const ORDER_STATUSES = ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}

export const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kg' },
  { value: 'm', label: 'Mét (m)' },
] as const

export type UnitType = (typeof UNIT_OPTIONS)[number]['value']

/* ── Zod Schemas ── */

export const orderItemSchema = z.object({
  fabricType: z.string().trim().min(2, 'Loại vải tối thiểu 2 ký tự'),
  colorName: z.string().trim().max(120).optional().or(z.literal('')),
  colorCode: z.string().trim().max(20).optional().or(z.literal('')),
  unit: z.enum(['m', 'kg']).default('kg'),
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
  colorName: 'Mộc (Raw)',
  colorCode: '',
  unit: 'kg',
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

// =========================
// TABLE COLUMNS (Tĩnh)
// =========================
export const orderTableColumns = [
  { key: "id", label: "Mã đơn" },
  { key: "customer_name", label: "Khách hàng" },
  { key: "order_date", label: "Ngày" },
  { key: "status", label: "Trạng thái" },
  { key: "total_amount", label: "Tổng tiền" },
]
