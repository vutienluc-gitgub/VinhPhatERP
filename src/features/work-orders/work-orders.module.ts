import { z } from 'zod';

import type { FeatureDefinition } from '@/shared/types/feature';

import type { WorkOrderStatus } from './types';

// Constants
export const WORK_ORDER_STATUSES: Record<WorkOrderStatus, { label: string; color: string }> = {
  draft: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'Đang sản xuất', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-rose-100 text-rose-700' },
};

// Zod Schemas
export const createWorkOrderSchema = z.object({
  work_order_number: z.string().min(1, 'Mã lệnh sản xuất là bắt buộc'),
  order_id: z.string().nullable().optional(),
  supplier_id: z.string().min(1, 'Vui lòng chọn nhà dệt gia công'), // Phải chọn nhà dệt
  bom_template_id: z.string().min(1, 'Cần chọn BOM để sản xuất'),
  weaving_unit_price: z.number().min(0, 'Đơn giá không được âm').default(0), // Đơn giá gia công
  target_quantity_m: z.number().positive('Sản lượng mục tiêu phải lớn hơn 0'),
  target_unit: z.string().default('m'),
  target_weight_kg: z.number().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const completeWorkOrderSchema = z.object({
  actual_yield_m: z.number().positive('Sản lượng thực tế (m) phải lớn hơn 0'),
});

export type CompleteWorkOrderInput = z.infer<typeof completeWorkOrderSchema>;

// Feature Definition
export const workOrdersFeature: FeatureDefinition = {
  key: 'work-orders',
  route: '/work-orders',
  title: 'Lệnh Sản Xuất',
  description: 'Quản lý lệnh sản xuất, kết nối BOM và phân bổ sợi',
  badge: 'Sản Xuất',
  highlights: [
    'Quản lý lệnh dệt',
    'Phân bổ BOM chi tiết',
    'Theo dõi năng suất mộc'
  ],
  resources: ['work_orders', 'work_order_y_requirements'],
  entities: ['Lệnh sản xuất', 'Nhu cầu sợi'],
  nextMilestones: ['Kết nối module nhuộm', 'Kho vận mộc']
};
