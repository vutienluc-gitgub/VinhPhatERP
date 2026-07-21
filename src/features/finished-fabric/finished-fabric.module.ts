import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
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

import { FINISHED_FABRIC_MODULE_LABELS as MSG } from './finished-fabric.constants';

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
  title: MSG.FEATURE_TITLE,
  badge: 'Beta',
  description: MSG.FEATURE_DESC,
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

export const finishedFabricPlugin: FeaturePlugin = {
  key: 'finished-fabric',
  route: 'finished-fabric',
  label: MSG.PLUGIN_LABEL,
  shortLabel: MSG.PLUGIN_SHORT_LABEL,
  description: MSG.PLUGIN_DESC,
  icon: 'Sparkles',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'warehouse',
  order: 30,
  routes: [
    {
      path: 'finished-fabric',
      component: () =>
        import('./FinishedFabricPage').then((m) => ({
          default: m.FinishedFabricPage,
        })),
    },
  ],
};

export default createModule(finishedFabricFeature);
