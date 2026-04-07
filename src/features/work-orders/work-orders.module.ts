import type { FeatureDefinition } from '@/shared/types/feature'

export type { WorkOrderStatus } from '@/schema/work-order.schema'

export {
  WORK_ORDER_STATUSES,
  createWorkOrderSchema,
  completeWorkOrderSchema,
} from '@/schema/work-order.schema'
export type { CreateWorkOrderInput, CompleteWorkOrderInput } from '@/schema/work-order.schema'

// Domain types stay in feature (tightly coupled to DB shape)
export type { WorkOrder, WorkOrderWithRelations, WorkOrderYarnRequirement } from './types'

export const workOrdersFeature: FeatureDefinition = {
  key: 'work-orders',
  route: '/work-orders',
  title: 'Lệnh Sản Xuất',
  description: 'Quản lý lệnh sản xuất, kết nối BOM và phân bổ sợi',
  badge: 'Sản Xuất',
  highlights: [
    'Quản lý lệnh dệt',
    'Phân bổ BOM chi tiết',
    'Theo dõi năng suất mộc',
  ],
  resources: ['work_orders', 'work_order_y_requirements'],
  entities: ['Lệnh sản xuất', 'Nhu cầu sợi'],
  nextMilestones: ['Kết nối module nhuộm', 'Kho vận mộc'],
}
