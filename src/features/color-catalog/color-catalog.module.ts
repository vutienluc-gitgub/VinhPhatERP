import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const colorCatalogFeature: FeatureDefinition = {
  key: 'color-catalog',
  route: '/color-catalog',
  title: 'Danh mục màu sắc',
  badge: 'Master Data',
  description:
    'Quản lý bảng màu dùng chung cho toàn hệ thống sản xuất, phân nhóm theo tông màu.',
  summary: [
    {
      label: 'Nhóm màu',
      value: '3 (Đậm, Trung, Lợt)',
    },
    {
      label: 'Xu hướng',
      value: 'Theo năm',
    },
  ],
  highlights: [
    'Phân nhóm tông màu: Đậm, Trung, Lợt.',
    'Tự động sinh mã hex từ code nếu chưa có trong bảng chuẩn.',
  ],
  entities: ['colors'],
  nextMilestones: ['Tích hợp bảng màu vào quy trình nhuộm (Dyeing Orders).'],
};

export const colorCatalogPlugin: FeaturePlugin = {
  key: 'color-catalog',
  route: 'color-catalog',
  label: 'Màu sắc',
  shortLabel: 'Màu',
  description: 'Quản lý danh mục màu sắc dùng chung cho toàn hệ thống.',
  icon: 'Palette',
  requiredRoles: ['admin', 'manager'],
  group: 'master-data',
  order: 55,
  routes: [
    {
      path: 'color-catalog',
      component: () =>
        import('./ColorCatalogPage').then((m) => ({
          default: m.ColorCatalogPage,
        })),
    },
  ],
};

export default createModule(colorCatalogFeature);
