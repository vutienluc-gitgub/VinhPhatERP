import { lazy, Suspense } from 'react';

import type { ERPPlugin } from '@/app/types/plugin';
import { ModuleErrorBoundary } from '@/components/ui/ModuleErrorBoundary';

const BomListPage = lazy(() =>
  import('./BomListPage').then((m) => ({ default: m.BomListPage })),
);
const BomCreatePage = lazy(() =>
  import('./BomCreatePage').then((m) => ({ default: m.BomCreatePage })),
);
const BomDetailPage = lazy(() =>
  import('./BomDetailPage').then((m) => ({ default: m.BomDetailPage })),
);
const BomEditPage = lazy(() =>
  import('./BomEditPage').then((m) => ({ default: m.BomEditPage })),
);

const wrap = (C: ReturnType<typeof lazy>) => (
  <ModuleErrorBoundary>
    <Suspense
      fallback={
        <div className="p-4 text-sm text-slate-500">Đang tải BOM module...</div>
      }
    >
      <C />
    </Suspense>
  </ModuleErrorBoundary>
);

export const bomPluginV2: ERPPlugin = {
  id: 'module-bom',
  name: 'Định mức (BOM)',
  icon: 'GitMerge',
  requiredRoles: ['admin', 'manager'],
  group: 'production',
  order: 45,
  entryPath: '/bom',
  routes: [
    { path: '/bom', element: wrap(BomListPage) },
    { path: '/bom/create', element: wrap(BomCreatePage) },
    { path: '/bom/:id', element: wrap(BomDetailPage) },
    { path: '/bom/:id/edit', element: wrap(BomEditPage) },
  ],
  onInit: async () => {
    // Preload config, setup store if needed
  },
};
