import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

import { DYEING_ORDER_MESSAGES as MSG } from './dyeing-orders.constants';

export const dyeingOrdersPlugin: FeaturePlugin = {
  key: 'dyeing-orders',
  route: 'dyeing-orders',
  label: MSG.MODULE_LABEL,
  shortLabel: MSG.MODULE_SHORT_LABEL,
  description: MSG.MODULE_DESC,
  icon: 'Droplet',
  primaryMobile: true,
  group: 'production',
  order: 58,
  requiredRoles: ['admin', 'manager'],
  routeGuard: 'manager',
  routes: [
    {
      path: 'dyeing-orders',
      component: () =>
        import('./DyeingOrdersPage').then((m) => ({
          default: m.DyeingOrdersPage,
        })),
    },
  ],
};
