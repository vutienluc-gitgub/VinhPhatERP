import type { ERPPlugin } from '@/app/types/plugin';

export const fabricCatalogPlugin: ERPPlugin = {
  key: 'fabric-catalog',
  label: 'Mẫu Vải (Fabric Catalog)',
  shortLabel: 'Mẫu Vải',
  description: 'Quản lý mẫu mã, cấu trúc và bảng màu vải dệt',
  icon: 'Layers',
  group: 'master-data',
  order: 76,
  entryPath: '/fabric-catalog',
  routes: [
    {
      path: '/fabric-catalog',
      component: () => import('./FabricCatalogPage').then((m) => ({ default: m.FabricCatalogPage })),
    },
    {
      path: '/fabric-catalog/:id',
      component: () => import('./FabricCatalogDetailPage').then((m) => ({ default: m.FabricCatalogDetailPage })),
    },
  ],
};

export default fabricCatalogPlugin;
