import type { FeatureDefinition } from '@/shared/types/feature';

// Domain type from local file (tightly coupled to DB shape)
export type { BomStatus } from '@/schema/bom.schema';

export {
  BOM_STATUSES,
  BOM_STATUS_LABELS,
  BOM_STATUS_COLORS,
  bomYarnItemSchema,
  bomTemplateSchema,
} from '@/schema/bom.schema';
export type { BomTemplateFormData } from '@/schema/bom.schema';

export const bomFeature: FeatureDefinition = {
  key: 'bom',
  route: '/bom',
  title: 'Định mức (BOM)',
  badge: 'Advanced',
  description:
    'Quản lý định mức nguyên vật liệu (Bill of Materials) cho các công thức sản xuất.',
  summary: [
    {
      label: 'Version control',
      value: 'Có',
    },
    {
      label: 'Phê duyệt',
      value: 'Bắt buộc',
    },
  ],
  highlights: ['BOM định nghĩa tỷ lệ hao hụt.', 'Quản lý phiên bản bất biến.'],
  resources: [
    'Chỉ cập nhật bản nháp.',
    'Duyệt để chốt định mức cho lệnh sản xuất.',
  ],
  entities: ['bom_templates', 'bom_yarn_items', 'bom_versions'],
  nextMilestones: ['Tích hợp BOM vào tính kế hoạch nguyên liệu trong Work Orders.',],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const bomPlugin: FeaturePlugin = {
  key: 'bom',
  route: 'bom',
  label: 'Định mức (BOM)',
  shortLabel: 'BOM',
  description: 'Cấu hình định mức nguyên vật liệu sợi cho từng mã vải mộc.',
  icon: 'layers',
  requiredRoles: ['admin', 'manager'],
  routeGuard: 'manager',
  group: 'production',
  order: 45,
  component: () => import('./BomPage').then((m) => ({ default: m.BomPage })),
};
