import type { FeatureDefinition } from '@/shared/types/feature';

export {
  FABRIC_CATALOG_STATUSES,
  FABRIC_CATALOG_STATUS_LABELS,
  fabricCatalogSchema,
  fabricCatalogDefaultValues,
} from '@/schema/fabric-catalog.schema';
export type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

export const fabricCatalogFeature: FeatureDefinition = {
  key: 'fabric-catalog',
  route: '/fabric-catalog',
  title: 'Danh mục vải',
  badge: 'Master Data',
  description:
    'Quản lý danh mục loại vải — dùng chung cho vải mộc và vải thành phẩm.',
  summary: [
    {
      label: 'Loại dữ liệu',
      value: 'Master Data',
    },
    {
      label: 'Tích hợp',
      value: 'BOM, Vải mộc, Thành phẩm',
    },
  ],
  highlights: [
    'Chuẩn hoá tên và thành phần vải, giảm lỗi nhập liệu.',
    'Dùng chung cho BOM, nhập vải mộc và vải thành phẩm.',
  ],
  resources: [
    'Bảng fabric_catalogs với mã, tên, thành phần.',
    'FK target_fabric_id trong bom_templates.',
  ],
  entities: ['FabricCatalog'],
  nextMilestones: ['Liên kết với raw_fabric_rolls và finished_fabric_rolls.'],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const fabricCatalogPlugin: FeaturePlugin = {
  key: 'fabric-catalog',
  route: 'fabric-catalog',
  label: 'Danh mục vải',
  shortLabel: 'Vải',
  description:
    'Quản lý danh mục loại vải — dùng chung cho vải mộc và thành phẩm.',
  icon: 'layout-grid',
  group: 'master-data',
  order: 76,
  component: () =>
    import('./index').then((m) => ({ default: m.FabricCatalogPage })),
};
