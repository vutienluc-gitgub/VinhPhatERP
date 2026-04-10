import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import type { BomStatus, BomTemplateFormData } from '@/schema/bom.schema';
import {
  BOM_STATUS_COLORS,
  BOM_STATUS_LABELS,
  BOM_STATUSES,
  bomTemplateSchema,
  bomYarnItemSchema,
} from '@/schema/bom.schema';

export type { BomStatus, BomTemplateFormData };
export {
  BOM_STATUS_COLORS,
  BOM_STATUS_LABELS,
  BOM_STATUSES,
  bomTemplateSchema,
  bomYarnItemSchema,
};

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
  entities: ['bom_templates', 'bom_yarn_items', 'bom_versions'],
  nextMilestones: [
    'Tich hop BOM vao tinh ke hoach nguyen lieu trong Work Orders.',
  ],
};
export const bomPlugin: FeaturePlugin = {
  key: 'bom',
  route: 'bom',
  label: 'Định mức (BOM)',
  shortLabel: 'BOM',
  description: 'Cấu hình định mức nguyên vật liệu sợi cho từng mã vải mộc.',
  icon: 'layers',
  requiredRoles: ['admin', 'manager'],
  group: 'production',
  order: 45,
  component: () => import('./BomPage').then((m) => ({ default: m.BomPage })),
};

export default createModule(bomFeature);
