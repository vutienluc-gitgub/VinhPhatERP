import type { ERPPlugin } from '@/app/types/plugin';

export const settingsPluginV2: ERPPlugin = {
  key: 'settings',
  label: 'Cai dat',
  shortLabel: 'Cau hinh',
  description: 'Cai dat he thong va tham so van hanh',
  icon: 'Settings',
  requiredRoles: ['admin'],
  group: 'system',
  order: 90,
  entryPath: '/settings',
  routes: [
    {
      path: '/settings',
      component: () =>
        import('./SettingsLayout').then((m) => ({ default: m.SettingsLayout })),
      children: [
        {
          path: 'general',
          component: () =>
            import('./pages/GeneralSettingsPage').then((m) => ({
              default: m.GeneralSettingsPage,
            })),
        },
        {
          path: 'finance',
          component: () =>
            import('./pages/FinanceSettingsPage').then((m) => ({
              default: m.FinanceSettingsPage,
            })),
        },
        {
          path: 'operations',
          component: () =>
            import('./pages/OperationsSettingsPage').then((m) => ({
              default: m.OperationsSettingsPage,
            })),
        },
        {
          path: 'system',
          component: () =>
            import('./pages/SystemSettingsPage').then((m) => ({
              default: m.SystemSettingsPage,
            })),
        },
      ],
    },
  ],
  onInit: async () => {
    // Preload config if necessary
  },
};
