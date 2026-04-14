import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

/**
 * Shipments Plugin (Level 9 Architecture)
 * Encapsulates all logistics and shipping delivery logic.
 */
export const shipmentsPlugin: FeaturePlugin = {
  key: 'shipments',
  label: 'Giao hàng',
  shortLabel: 'Ship',
  description:
    'Quản lý quy trình đóng gói và giao nhận hàng hóa tới khách hàng.',
  icon: 'Truck',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'sales',
  order: 70,
  routes: [
    {
      path: 'shipments',
      component: () =>
        import('./ShipmentsPage').then((m) => ({ default: m.ShipmentsPage })),
    },
  ],
};

// Export fallback for internal feature code if needed
export { SHIPMENT_STATUS_LABELS } from '@/schema/shipment.schema';
