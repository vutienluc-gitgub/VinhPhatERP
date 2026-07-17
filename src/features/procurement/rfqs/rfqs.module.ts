import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

import { RFQ_LABELS as MSG } from './rfqs.constants';

export const rfqsFeature: FeatureDefinition = {
  key: 'sourcing-rfqs',
  route: '/sourcing-rfqs',
  title: MSG.MODULE_TITLE,
  badge: 'Sourcing',
  description: MSG.MODULE_DESC,
  summary: [{ label: MSG.KPI_OPEN_RFQ, value: '0' }],
  highlights: [MSG.HIGHLIGHT_QR, MSG.HIGHLIGHT_SCORING],
  entities: ['sourcing_rfqs', 'sourcing_rfq_items'],
  nextMilestones: [MSG.MILESTONE_ZALO],
};

export const rfqsPlugin: FeaturePlugin = {
  key: 'sourcing-rfqs',
  route: 'sourcing-rfqs',
  label: MSG.PLUGIN_LABEL,
  shortLabel: 'RFQ',
  description: MSG.PLUGIN_DESC,
  icon: 'FileSearch',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 2,
  routes: [
    {
      path: 'sourcing-rfqs',
      component: () =>
        import('./RFQList').then((m) => ({ default: m.RFQList })),
    },
    {
      path: 'sourcing-rfqs/create',
      component: () =>
        import('./RFQCreate').then((m) => ({ default: m.RFQCreate })),
    },
    {
      path: 'sourcing-rfqs/:id',
      component: () =>
        import('./RFQDetail').then((m) => ({ default: m.RFQDetail })),
    },
  ],
};

export default createModule(rfqsFeature);
