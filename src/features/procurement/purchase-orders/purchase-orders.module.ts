import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

import { PO_CONSTANTS as MSG } from './purchase-orders.constants';

export const purchaseOrdersFeature: FeatureDefinition = {
  key: 'purchase-orders',
  route: '/purchase-orders',
  title: 'Purchase Orders',
  badge: 'Sourcing',
  description: MSG.MODULE_DESC,
  summary: [
    { label: MSG.KPI_PENDING_APPROVAL, value: '0' },
    { label: MSG.KPI_DELIVERING, value: '0' },
  ],
  highlights: [MSG.FEATURE_LIFECYCLE, MSG.FEATURE_BLOCK_GR, MSG.FEATURE_SYNC],
  entities: [
    'purchase_orders',
    'purchase_order_items',
    'goods_receipts',
    'goods_receipt_items',
  ],
  nextMilestones: [MSG.MILESTONE_EMAIL],
};

export const purchaseOrdersPlugin: FeaturePlugin = {
  key: 'purchase-orders',
  route: 'purchase-orders',
  label: MSG.MODULE_TITLE,
  shortLabel: 'PO',
  description: MSG.MODULE_DESC,
  icon: 'ShoppingCart',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 5,
  routes: [
    {
      path: 'purchase-orders',
      component: () =>
        import('./PurchaseOrdersPage').then((m) => ({
          default: m.default || m.PurchaseOrdersPage,
        })),
    },
    {
      path: 'purchase-orders/create',
      component: () =>
        import('./POCreatePage').then((m) => ({
          default: m.default || m.POCreatePage,
        })),
    },
    {
      path: 'purchase-orders/:id',
      component: () =>
        import('./PODetailPage').then((m) => ({
          default: m.default || m.PODetailPage,
        })),
    },
  ],
};

export default createModule(purchaseOrdersFeature);
