import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import type { ERPPlugin } from '@/app/types/plugin';
import { ModuleErrorBoundary } from '@/components/ui/ModuleErrorBoundary';

const SettingsLayout = lazy(() =>
  import('./SettingsLayout').then((m) => ({ default: m.SettingsLayout })),
);

const GeneralSettingsPage = lazy(() =>
  import('./pages/GeneralSettingsPage').then((m) => ({
    default: m.GeneralSettingsPage,
  })),
);

const FinanceSettingsPage = lazy(() =>
  import('./pages/FinanceSettingsPage').then((m) => ({
    default: m.FinanceSettingsPage,
  })),
);

const OperationsSettingsPage = lazy(() =>
  import('./pages/OperationsSettingsPage').then((m) => ({
    default: m.OperationsSettingsPage,
  })),
);

const SystemSettingsPage = lazy(() =>
  import('./pages/SystemSettingsPage').then((m) => ({
    default: m.SystemSettingsPage,
  })),
);

const wrap = (C: ReturnType<typeof lazy>) => (
  <ModuleErrorBoundary>
    <Suspense
      fallback={
        <div className="p-4 text-sm text-slate-500">Đang tải cấu hình...</div>
      }
    >
      <C />
    </Suspense>
  </ModuleErrorBoundary>
);

export const settingsPluginV2: ERPPlugin = {
  id: 'module-settings',
  name: 'Cài đặt',
  icon: 'Settings',
  requiredRoles: ['admin'],
  group: 'system',
  order: 90,
  entryPath: '/settings',
  routes: [
    {
      path: '/settings',
      element: wrap(SettingsLayout),
      children: [
        { index: true, element: <Navigate to="general" replace /> },
        { path: 'general', element: wrap(GeneralSettingsPage) },
        { path: 'finance', element: wrap(FinanceSettingsPage) },
        { path: 'operations', element: wrap(OperationsSettingsPage) },
        { path: 'system', element: wrap(SystemSettingsPage) },
      ],
    },
  ],
  onInit: async () => {
    // Preload config if necessary
  },
};
