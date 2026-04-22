import { z } from 'zod';

export type WorkOrderStatus =
  | 'draft'
  | 'yarn_issued'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const WORK_ORDER_STATUSES: Record<
  WorkOrderStatus,
  { label: string; color: string }
> = {
  draft: {
    label: 'Bản nháp',
    color: 'bg-slate-100 text-slate-700',
  },
  yarn_issued: {
    label: 'Đã xuất sợi',
    color: 'bg-indigo-100 text-indigo-700',
  },
  in_progress: {
    label: 'Đang sản xuất',
    color: 'bg-blue-100 text-blue-700',
  },
  completed: {
    label: 'Hoàn thành',
    color: 'bg-emerald-100 text-emerald-700',
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'bg-rose-100 text-rose-700',
  },
};

export const createWorkOrderSchema = z.object({
  work_order_number: z.string().min(1, 'Mã lệnh sản xuất là bắt buộc'),
  order_id: z.string().nullable().optional(),
  supplier_id: z.string().min(1, 'Vui lòng chọn nhà dệt gia công'),
  bom_template_id: z.string().min(1, 'Cần chọn BOM để sản xuất'),
  weaving_unit_price: z.number().min(0, 'Đơn giá không được âm').default(0),
  target_quantity: z.number().positive('Sản lượng mục tiêu phải lớn hơn 0'),
  target_unit: z.string().default('m'),
  target_weight_kg: z.number().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  standard_loss_pct: z.number().default(0),
  yarn_requirements: z
    .array(
      z.object({
        yarn_catalog_id: z.string().min(1, 'Chọn loại sợi'),
        bom_ratio_pct: z.number().min(0).max(100),
        required_kg: z.number().min(0),
      }),
    )
    .min(1, 'Cần phân bổ ít nhất một loại sợi'),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const completeWorkOrderSchema = z.object({
  actual_yield_m: z.number().positive('Sản lượng thực tế (m) phải lớn hơn 0'),
});

export type CompleteWorkOrderInput = z.infer<typeof completeWorkOrderSchema>;
