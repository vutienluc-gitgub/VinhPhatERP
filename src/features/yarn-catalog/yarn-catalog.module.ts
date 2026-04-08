import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

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

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const yarnCatalogPlugin: FeaturePlugin = {
  key: 'yarn-catalog',
  route: 'yarn-catalog',
  label: 'Danh mục Sợi',
  shortLabel: 'Loại Sợi',
  description:
    'Quản lý thông tin kỹ thuật và phân loại các loại sợi nguyên liệu.',
  icon: 'package',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 30,
  component: () =>
    import('./YarnCatalogPage').then((m) => ({ default: m.YarnCatalogPage })),
};

export default createModule(yarnCatalogFeature);
