import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import {
  yarnCatalogDefaultValues,
  yarnCatalogSchema,
  YARN_CATALOG_STATUS_LABELS,
} from '@/schema/yarn-catalog.schema';

export {
  yarnCatalogDefaultValues,
  yarnCatalogSchema,
  YARN_CATALOG_STATUS_LABELS,
};
export type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';

export const yarnCatalogFeature: FeatureDefinition = {
  key: 'yarn-catalog',
  route: '/yarn-catalog',
  title: 'Danh mục Sợi',
  badge: 'Material',
  description:
    'Quản lý các loại sợi (Cotton, Poly, CVC...), chi số sợi và nhà cung cấp sợi.',
  summary: [
    {
      label: 'Loại sợi',
      value: '120+',
    },
    {
      label: 'Nhà cung cấp',
      value: '15',
    },
  ],
  highlights: [
    'Tra cứu thông số sợi.',
    'Lịch sử biến động giá sợi.',
    'Phân nhóm sợi theo chất liệu.',
  ],
  entities: ['yarn_templates'],
  nextMilestones: ['Quản lý chứng chỉ chất lượng sợi (OEKO-TEX...).'],
};

export const yarnCatalogPlugin: FeaturePlugin = {
  key: 'yarn-catalog',
  route: 'yarn-catalog',
  label: 'Danh mục Sợi',
  shortLabel: 'Loại Sợi',
  description:
    'Quản lý thông tin kỹ thuật và phân loại các loại sợi nguyên liệu.',
  icon: 'Grip',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 30,
  routes: [
    {
      path: 'yarn-catalog',
      component: () =>
        import('./YarnCatalogPage').then((m) => ({
          default: m.YarnCatalogPage,
        })),
    },
  ],
};

export default createModule(yarnCatalogFeature);
