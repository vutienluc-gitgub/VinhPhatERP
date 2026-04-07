import type { FeatureDefinition } from '@/shared/types/feature'

// Re-export schema & constants from centralized schema
export {
  PRODUCTION_STAGES,
  STAGE_LABELS,
  STAGE_STATUS_LABELS,
  orderProgressSchema,
} from '@/schema/order-progress.schema'
export type {
  ProductionStage,
  StageStatus,
  OrderProgressFormValues,
} from '@/schema/order-progress.schema'

// Domain types stay in feature (tightly coupled to DB shape)
export type { OrderProgress, OrderProgressWithOrder, ProgressAuditLog, ProgressAuditLogWithOrder } from './types'

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