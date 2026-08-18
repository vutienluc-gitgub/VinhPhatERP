import type { ERPPlugin } from '@/app/types/plugin';

export const bomPluginV2: ERPPlugin = {
  key: 'bom',
  label: 'Dinh muc (BOM)',
  shortLabel: 'BOM',
  description: 'Quan ly dinh muc nguyen phu lieu',
  icon: 'GitMerge',
  requiredRoles: ['admin', 'manager'],
  group: 'production',
  order: 45,
  entryPath: '/bom',
  routes: [
    {
      path: '/bom',
      component: () =>
        import('./BomListPage').then((m) => ({ default: m.BomListPage })),
    },
    {
      path: '/bom/create',
      component: () =>
        import('./BomCreatePage').then((m) => ({ default: m.BomCreatePage })),
    },
    {
      path: '/bom/:id',
      component: () =>
        import('./BomDetailPage').then((m) => ({ default: m.BomDetailPage })),
    },
    {
      path: '/bom/:id/edit',
      component: () =>
        import('./BomEditPage').then((m) => ({ default: m.BomEditPage })),
    },
  ],
  onInit: async () => {
    // Preload config, setup store if needed
  },
};
