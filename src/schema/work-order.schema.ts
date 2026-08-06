import { z } from 'zod';

export type WorkOrderStatus =
  | 'draft'
  | 'yarn_issued'
  | 'in_progress'
  | 'pending_verification'
  | 'completed'
  | 'cancelled';

export const WORK_ORDER_STATUSES: Record<
  WorkOrderStatus,
  { label: string; color: string }
> = {
  draft: {
    label: 'Bản nháp',
    color: 'bg-surface-secondary text-secondary',
  },
  yarn_issued: {
    label: 'Đã xuất sợi',
    color: 'bg-info-soft text-info',
  },
  in_progress: {
    label: 'Đang sản xuất',
    color: 'bg-info-soft text-info',
  },
  pending_verification: {
    label: 'Chờ QC xác nhận',
    color: 'bg-warning-soft text-warning',
  },
  completed: {
    label: 'Hoàn thành',
    color: 'bg-success-soft text-success',
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'bg-danger-soft text-danger',
  },
};

/**
 * Tạo mã Lệnh Sản Xuất an toàn, không dùng Math.random() (chỉ 1000 giá trị/tháng).
 * Dùng crypto.randomUUID() → 65.536 giá trị hex 4 ký tự/tháng, thực tế không trùng.
 * Output: "WO-202506-A3F1"
 */
export function generateWorkOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const suffix = crypto
    .randomUUID()
    .replace(/-/g, '')
    .slice(0, 4)
    .toUpperCase();
  return `WO-${year}${month}-${suffix}`;
}

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
  loom_id: z.string().nullable().optional(),
  standard_loss_pct: z.number().default(0),
  yarn_requirements: z
    .array(
      z.object({
        yarn_catalog_id: z.string().min(1, 'Chọn loại sợi'),
        bom_ratio_pct: z.number().min(0).max(100),
        required_kg: z.number().min(0),
        allocated_kg: z.number().optional(),
      }),
    )
    .min(1, 'Cần phân bổ ít nhất một loại sợi'),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const completeWorkOrderSchema = z.object({
  actual_yield_m: z.number().positive('Sản lượng thực tế (m) phải lớn hơn 0'),
});

export type CompleteWorkOrderInput = z.infer<typeof completeWorkOrderSchema>;
