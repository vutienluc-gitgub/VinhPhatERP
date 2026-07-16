import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import { PLUGIN_MESSAGES as MSG } from '@/features/shipments/shipments.constants';

/**
 * Shipments Plugin (Level 9 Architecture)
 * Encapsulates all logistics and shipping delivery logic.
 */
export const shipmentsPlugin: FeaturePlugin = {
  key: 'shipments',
  label: MSG.LABEL,
  shortLabel: 'Ship',
  description: MSG.DESC,
  icon: 'Truck',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'warehouse',
  order: 70,
  routes: [
    {
      path: 'shipments',
      component: () =>
        import('./ShipmentsPage').then((m) => ({ default: m.ShipmentsPage })),
    },
    {
      path: 'shipments/k80-quick-print',
      component: () =>
        import('./pages/K80QuickShipmentPage').then((m) => ({
          default: m.K80QuickShipmentPage,
        })),
    },
    {
      path: 'shipments/dispatch',
      component: () =>
        import('./pages/ShipmentDispatchPage').then((m) => ({
          default: m.ShipmentDispatchPage,
        })),
    },
  ],
};
