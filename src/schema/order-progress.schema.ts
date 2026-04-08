import { z } from 'zod';

export const PRODUCTION_STAGES = [
  'warping',
  'weaving',
  'greige_check',
  'dyeing',
  'finishing',
  'final_check',
  'packing',
] as const;

export type ProductionStage = (typeof PRODUCTION_STAGES)[number];
export type StageStatus = 'pending' | 'in_progress' | 'done' | 'skipped';

export const STAGE_LABELS: Record<ProductionStage, string> = {
  warping: 'Mắc sợi',
  weaving: 'Dệt',
  greige_check: 'Kiểm vải mộc',
  dyeing: 'Nhuộm',
  finishing: 'Hoàn tất',
  final_check: 'Kiểm thành phẩm',
  packing: 'Đóng gói',
};

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  skipped: 'Bỏ qua',
};

export const orderProgressSchema = z.object({
  orderId: z.string().uuid(),
  stage: z.enum([
    'warping',
    'weaving',
    'greige_check',
    'dyeing',
    'finishing',
    'final_check',
    'packing',
  ]),
  status: z.enum(['pending', 'in_progress', 'done', 'skipped']),
  plannedDate: z.string().trim().optional().or(z.literal('')),
  actualDate: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type OrderProgressFormValues = z.infer<typeof orderProgressSchema>;
