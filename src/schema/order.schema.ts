import { z } from 'zod';

/* ── Types ── */

export type OrderStatus =
  | 'pending_review'
  | 'draft'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/* ── Configs & Labels ── */

export const ORDER_STATUSES = [
  'pending_review',
  'draft',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_review: 'Chờ duyệt',
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

export const UNIT_OPTIONS = [
  {
    value: 'kg',
    label: 'Kg',
  },
  {
    value: 'm',
    label: 'Mét (m)',
  },
] as const;

export type UnitType = (typeof UNIT_OPTIONS)[number]['value'];

/* ── Zod Schemas ── */

// 1. Định nghĩa ITEM schema cơ bản
export const orderItemBaseSchema = z.object({
  fabricType: z.string().trim().min(2, 'Loại vải tối thiểu 2 ký tự'),
  colorName: z.string().trim().max(120).optional().or(z.literal('')),
  colorCode: z.string().trim().max(20).optional().or(z.literal('')),
  unit: z.enum(['m', 'kg']).default('kg'),
  quantity: z
    .number({ required_error: 'Nhập số lượng' })
    .positive('Số lượng phải > 0'),
  unitPrice: z
    .number({ required_error: 'Nhập đơn giá' })
    .min(0, 'Đơn giá >= 0'),
});

// Item schema cho EDIT: cho phép quantity >= 0
export const orderItemEditSchema = orderItemBaseSchema.extend({
  quantity: z.number().min(0, 'Số lượng phải >= 0'),
});

// 2. Định nghĩa ORDER schema cơ bản (chưa có refine)
export const ordersBaseSchema = z.object({
  orderNumber: z.string().trim().optional().default(''),
  customerId: z.string().uuid('Chọn khách hàng'),
  orderDate: z.string().trim().min(1, 'Chọn ngày đặt hàng'),
  deliveryDate: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(orderItemBaseSchema).min(1, 'Phải có ít nhất 1 dòng hàng'),
});

// 3. Tạo Schema hoàn chỉnh với Refine
export const ordersSchema = ordersBaseSchema.refine(
  (data) => {
    if (!data.deliveryDate) return true;
    return data.deliveryDate >= data.orderDate;
  },
  {
    message: 'Ngày giao hàng phải sau ngày đặt hàng',
    path: ['deliveryDate'],
  },
);

// 4. Tạo Schema EDIT hoàn chỉnh
export const ordersSchemaEdit = ordersBaseSchema
  .extend({
    items: z.array(orderItemEditSchema).min(1, 'Phải có ít nhất 1 dòng hàng'),
  })
  .refine(
    (data) => {
      if (!data.deliveryDate) return true;
      return data.deliveryDate >= data.orderDate;
    },
    {
      message: 'Ngày giao hàng phải sau ngày đặt hàng',
      path: ['deliveryDate'],
    },
  );

// Tiện ích xuất kiểu dữ liệu
export type OrdersFormValues = z.infer<typeof ordersSchema>;
export type OrderItemFormValues = z.infer<typeof orderItemBaseSchema>;

export const emptyOrderItem: OrderItemFormValues = {
  fabricType: '',
  colorName: 'Mộc (Raw)',
  colorCode: '',
  unit: 'kg',
  quantity: 0,
  unitPrice: 0,
};

export const ordersDefaultValues: OrdersFormValues = {
  orderNumber: '',
  customerId: '',
  orderDate: new Date().toISOString().slice(0, 10),
  deliveryDate: '',
  notes: '',
  items: [{ ...emptyOrderItem }],
};

export const orderResponseSchema = z
  .object({
    id: z.string().uuid(),
    order_number: z.string(),
    total_amount: z.number(),
  })
  .passthrough();

// =========================
// TABLE COLUMNS (Tĩnh)
// =========================
export const orderTableColumns = [
  {
    key: 'id',
    label: 'Mã đơn',
  },
  {
    key: 'customer_name',
    label: 'Khách hàng',
  },
  {
    key: 'order_date',
    label: 'Ngày',
  },
  {
    key: 'status',
    label: 'Trạng thái',
  },
  {
    key: 'total_amount',
    label: 'Tổng tiền',
  },
];
