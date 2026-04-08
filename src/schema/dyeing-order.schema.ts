import { z } from 'zod';

/* ── Types ── */

export type DyeingOrderStatus =
  | 'draft'
  | 'sent'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const DYEING_ORDER_STATUSES: Record<
  DyeingOrderStatus,
  { label: string; color: string }
> = {
  draft: {
    label: 'Bản nháp',
    color: 'var(--status-draft)',
  },
  sent: {
    label: 'Đã gửi nhuộm',
    color: 'var(--status-sent)',
  },
  in_progress: {
    label: 'Đang nhuộm',
    color: 'var(--status-progress)',
  },
  completed: {
    label: 'Hoàn thành',
    color: 'var(--status-done)',
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'var(--status-cancelled)',
  },
};

export const DYEING_ORDER_STATUS_LIST = [
  'draft',
  'sent',
  'in_progress',
  'completed',
  'cancelled',
] as const;

/* ── Zod Schemas ── */

export const dyeingOrderItemSchema = z.object({
  raw_fabric_roll_id: z.string().min(1, 'Chọn cây vải mộc'),
  weight_kg: z.number().positive('Trọng lượng phải > 0'),
  length_m: z.number().min(0).optional().or(z.literal(0)),
  color_name: z.string().min(1, 'Nhập màu nhuộm'),
  color_code: z.string().max(30).optional().or(z.literal('')),
  notes: z.string().max(300).optional().or(z.literal('')),
});

export type DyeingOrderItemFormValues = z.infer<typeof dyeingOrderItemSchema>;

export const dyeingOrderSchema = z.object({
  dyeing_order_number: z.string().min(3, 'Mã lệnh nhuộm tối thiểu 3 ký tự'),
  supplier_id: z.string().min(1, 'Chọn nhà nhuộm'),
  order_date: z.string().min(1, 'Chọn ngày gửi'),
  expected_return_date: z.string().optional().or(z.literal('')),
  unit_price_per_kg: z.number().min(0, 'Đơn giá >= 0').default(0),
  work_order_id: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(dyeingOrderItemSchema).min(1, 'Phải có ít nhất 1 cây vải'),
});

export type DyeingOrderFormValues = z.infer<typeof dyeingOrderSchema>;

export const dyeingOrderDefaults: DyeingOrderFormValues = {
  dyeing_order_number: '',
  supplier_id: '',
  order_date: new Date().toISOString().slice(0, 10),
  expected_return_date: '',
  unit_price_per_kg: 0,
  work_order_id: '',
  notes: '',
  items: [
    {
      raw_fabric_roll_id: '',
      weight_kg: 0,
      length_m: 0,
      color_name: '',
      color_code: '',
      notes: '',
    },
  ],
};

export const emptyDyeingOrderItem: DyeingOrderItemFormValues = {
  raw_fabric_roll_id: '',
  weight_kg: 0,
  length_m: 0,
  color_name: '',
  color_code: '',
  notes: '',
};
