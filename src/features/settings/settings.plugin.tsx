import { lazy, Suspense } from 'react';

import type { ERPPlugin } from '@/app/types/plugin';
import { ModuleErrorBoundary } from '@/components/ui/ModuleErrorBoundary';

const SettingsPage = lazy(() =>
  import('./SettingsPage').then((m) => ({ default: m.SettingsPage })),
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
  routes: [{ path: '/settings', element: wrap(SettingsPage) }],
  onInit: async () => {
    // Preload config if necessary
  },
};
