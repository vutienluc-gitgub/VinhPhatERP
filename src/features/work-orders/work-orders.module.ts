import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import {
  WORK_ORDER_STATUSES,
  createWorkOrderSchema,
} from '@/schema/work-order.schema';
import type {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderWithRelations,
} from '@/features/work-orders/types';

export type { WorkOrder, WorkOrderStatus, WorkOrderWithRelations };

export { WORK_ORDER_STATUSES, createWorkOrderSchema };
export type {
  CreateWorkOrderInput,
  CompleteWorkOrderInput,
} from '@/schema/work-order.schema';

export const workOrdersFeature: FeatureDefinition = {
  key: 'work-orders',
  route: '/work-orders',
  title: 'Lệnh sản xuất (Dệt)',
  badge: 'Production',
  description:
    'Quản lý các lệnh dệt vải, giao kế hoạch cho máy dệt và theo dõi sản lượng thực tế.',
  summary: [
    {
      label: 'Lệnh đang chạy',
      value: '24',
    },
    {
      label: 'Hiệu suất máy',
      value: '92%',
    },
  ],
  highlights: [
    'Phân bổ lệnh cho máy dệt.',
    'Theo dõi sản lượng theo ca.',
    'Kiểm soát hao hụt sợi.',
  ],
  entities: ['work_orders', 'work_order_items'],
  nextMilestones: [
    'Tích hợp cảm biến IOT theo dõi tốc độ máy dệt.',
    'Lịch bảo trì máy tự động.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const workOrdersPlugin: FeaturePlugin = {
  key: 'work-orders',
  route: 'work-orders',
  label: 'Lệnh dệt',
  shortLabel: 'Dệt',
  description: 'Quản lý lệnh sản xuất dệt vải mộc từ kho sợi.',
  icon: 'layers',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 20,
  component: () =>
    import('./WorkOrderPage').then((m) => ({ default: m.WorkOrdersPage })),
};

export default createModule(workOrdersFeature);
