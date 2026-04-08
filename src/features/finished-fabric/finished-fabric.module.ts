import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import {
  QUALITY_GRADES,
  ROLL_STATUSES,
  QUALITY_GRADE_LABELS,
  ROLL_STATUS_LABELS,
  finishedFabricSchema,
  finishedFabricDefaults,
  bulkFinishedInputSchema,
  bulkFinishedInputDefaults,
  formatBulkRollNumber,
  findDuplicateRollNumbers,
} from '@/schema/finished-fabric.schema';

export {
  QUALITY_GRADES,
  ROLL_STATUSES,
  QUALITY_GRADE_LABELS,
  ROLL_STATUS_LABELS,
  finishedFabricSchema,
  finishedFabricDefaults,
  bulkFinishedInputSchema,
  bulkFinishedInputDefaults,
  formatBulkRollNumber,
  findDuplicateRollNumbers,
};
export type {
  FinishedFabricFormValues,
  BulkFinishedInputFormValues,
} from '@/schema/finished-fabric.schema';

export const finishedFabricFeature: FeatureDefinition = {
  key: 'finished-fabric',
  route: '/finished-fabric',
  title: 'Vải thành phẩm (Lưu kho)',
  badge: 'Beta',
  description:
    'Quản lý tồn kho vải đã nhuộm thành phẩm, sẵn sàng giao hàng hoặc xả kho.',
  summary: [
    {
      label: 'Tổng cây vải',
      value: '2.5k',
    },
    {
      label: 'Khả dụng',
      value: '1.8k',
    },
  ],
  highlights: [
    'Quản lý vị trí kệ.',
    'Kiểm soát xả kho chính xác.',
    'Báo cáo tồn kho theo đơn hàng.',
  ],
  entities: ['finished_fabric_rolls', 'warehouse_locations'],
  nextMilestones: [
    'Tích hợp in mã vạch tự động.',
    'Cảnh báo tồn kho lâu ngày.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const finishedFabricPlugin: FeaturePlugin = {
  key: 'finished-fabric',
  route: 'finished-fabric',
  label: 'Kho Thành phẩm',
  shortLabel: 'Thành phẩm',
  description: 'Theo dõi tồn kho vải đã nhuộm, nhập kho và xuất kho giao hàng.',
  icon: 'layers',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 30,
  component: () =>
    import('./FinishedFabricPage').then((m) => ({
      default: m.FinishedFabricPage,
    })),
};

export default createModule(finishedFabricFeature);
