import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import {
  FABRIC_CATALOG_STATUS_LABELS,
  FABRIC_CATALOG_STATUSES,
  fabricCatalogSchema,
  fabricCatalogDefaultValues,
} from '@/schema/fabric-catalog.schema';

export {
  FABRIC_CATALOG_STATUS_LABELS,
  FABRIC_CATALOG_STATUSES,
  fabricCatalogSchema,
  fabricCatalogDefaultValues,
};
export type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

export const fabricCatalogFeature: FeatureDefinition = {
  key: 'fabric-catalog',
  route: '/fabric-catalog',
  title: 'Danh mục Vải',
  badge: 'Internal',
  description:
    'Thư viện mẫu vải, thông số kỹ thuật, kiểu dệt và định mức hao hụt chuẩn.',
  summary: [
    {
      label: 'Mẫu vải',
      value: '450+',
    },
    {
      label: 'Kiểu dệt',
      value: '25+',
    },
  ],
  highlights: [
    'Tra cứu mã vải nhanh.',
    'Lưu trữ thông số dệt chuẩn.',
    'Quản lý hình ảnh mẫu thực tế.',
  ],
  entities: ['fabric_templates', 'yarn_requirements'],
  nextMilestones: [
    'Tự động tính giá thành kế hoạch.',
    'Phân tích xu hướng thị trường.',
  ],
};

export const fabricCatalogPlugin: FeaturePlugin = {
  key: 'fabric-catalog',
  route: 'fabric-catalog',
  label: 'Danh mục Vải',
  shortLabel: 'Mẫu Vải',
  description:
    'Quản lý thông số kỹ thuật các loại vải công ty có thể sản xuất.',
  icon: 'SwatchBook',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 40,
  routes: [
    {
      path: 'fabric-catalog',
      component: () =>
        import('./FabricCatalogPage').then((m) => ({
          default: m.FabricCatalogPage,
        })),
    },
  ],
};

export default createModule(fabricCatalogFeature);
