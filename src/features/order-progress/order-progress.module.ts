import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

import type { ProductionStage, StageStatus } from './types'

/* ── Constants ── */

export const PRODUCTION_STAGES: ProductionStage[] = [
  'warping', 'weaving', 'greige_check', 'dyeing', 'finishing', 'final_check', 'packing',
]

export const STAGE_LABELS: Record<ProductionStage, string> = {
  warping: 'Mắc sợi',
  weaving: 'Dệt',
  greige_check: 'Kiểm vải mộc',
  dyeing: 'Nhuộm',
  finishing: 'Hoàn tất',
  final_check: 'Kiểm thành phẩm',
  packing: 'Đóng gói',
}

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  skipped: 'Bỏ qua',
}

/* ── Zod schemas ── */

export const orderProgressSchema = z.object({
  orderId: z.string().uuid(),
  stage: z.enum(['warping', 'weaving', 'greige_check', 'dyeing', 'finishing', 'final_check', 'packing']),
  status: z.enum(['pending', 'in_progress', 'done', 'skipped']),
  plannedDate: z.string().trim().optional().or(z.literal('')),
  actualDate: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})

export type OrderProgressFormValues = z.infer<typeof orderProgressSchema>

export const orderProgressFeature: FeatureDefinition = {
  key: 'order-progress',
  route: '/order-progress',
  title: 'Tiến độ đơn hàng',
  badge: 'Scaffolded',
  description:
    'Tiến độ phân tách khỏi order và shipment để theo dõi vận hành theo stage, theo dòng hàng và theo mức độ trễ hạn.',
  highlights: [
    'Tiến độ theo từng dòng hàng, không chỉ theo header.',
    'Timeline update logs và progress percent.',
    'Chú ý cách hiển thị gọn trên mobile.',
  ],
  resources: [
    'Bang order_progress.',
    'Cap nhat thu cong truoc, automation sau.',
    'Dashboard overdue va ready_to_ship.',
  ],
  entities: ['Stage update', 'Delay reason', 'Percent done', 'Audit trail'],
  nextMilestones: [
    'Them board view theo stage.',
    'Tinh overdue va ready-to-ship slices.',
    'Ghi log thay doi khi status duoc cap nhat.',
  ],
}