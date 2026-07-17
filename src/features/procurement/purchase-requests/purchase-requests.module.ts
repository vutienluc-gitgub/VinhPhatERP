import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

import { PR_LABELS as MSG } from './purchase-requests.constants';

export const purchaseRequestsFeature: FeatureDefinition = {
  key: 'purchase-requests',
  route: '/purchase-requests',
  title: MSG.MODULE_TITLE,
  badge: 'Procurement',
  description: MSG.MODULE_DESC,
  summary: [{ label: MSG.KPI_PENDING, value: '0' }],
  highlights: [MSG.HIGHLIGHT_CENTRALIZED, MSG.HIGHLIGHT_AUTO_RFQ],
  entities: ['purchase_requests', 'purchase_request_items'],
  nextMilestones: [MSG.MILESTONE_ZALO],
};

export const purchaseRequestsPlugin: FeaturePlugin = {
  key: 'purchase-requests',
  route: 'purchase-requests',
  label: MSG.MODULE_LABEL,
  shortLabel: MSG.MODULE_SHORT_LABEL,
  description: MSG.PLUGIN_DESC,
  icon: 'ClipboardList',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 1,
  routes: [
    {
      path: 'purchase-requests',
      component: () => import('./PRList').then((m) => ({ default: m.PRList })),
    },
    {
      path: 'purchase-requests/create',
      component: () =>
        import('./PRCreate').then((m) => ({ default: m.PRCreate })),
    },
  ],
};

export default createModule(purchaseRequestsFeature);
