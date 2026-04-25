import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import {
  LOOM_STATUS_LABELS,
  LOOM_STATUSES,
  LOOM_TYPE_LABELS,
  LOOM_TYPES,
  loomSchema,
  loomDefaultValues,
} from '@/schema/loom.schema';

export {
  LOOM_STATUS_LABELS,
  LOOM_STATUSES,
  LOOM_TYPE_LABELS,
  LOOM_TYPES,
  loomSchema,
  loomDefaultValues,
};
export type { LoomFormValues } from '@/schema/loom.schema';

export const loomFeature: FeatureDefinition = {
  key: 'looms',
  route: '/looms',
  title: 'Danh mục Máy dệt',
  badge: 'Production',
  description:
    'Quản lý danh mục máy dệt, công suất, liên kết nhà dệt và truy xuất nguồn gốc cuộn mộc.',
  summary: [
    { label: 'Loại máy', value: '5+' },
    { label: 'Nhà dệt', value: '10+' },
  ],
  highlights: [
    'Quản lý công suất máy dệt.',
    'Liên kết máy dệt với nhà dệt.',
    'Truy xuất cuộn mộc từ máy dệt.',
  ],
  entities: ['looms'],
  nextMilestones: [
    'Theo dõi lịch bảo trì máy.',
    'Phân tích hiệu suất theo máy.',
  ],
};

export const loomPlugin: FeaturePlugin = {
  key: 'looms',
  route: 'looms',
  label: 'Danh mục Máy dệt',
  shortLabel: 'Máy dệt',
  description: 'Quản lý danh mục máy dệt, công suất và truy xuất nguồn gốc.',
  icon: 'Cog',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 45,
  routes: [
    {
      path: 'looms',
      component: () =>
        import('./LoomPage').then((m) => ({
          default: m.LoomPage,
        })),
    },
  ],
};

export default createModule(loomFeature);
