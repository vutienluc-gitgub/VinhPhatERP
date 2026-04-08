import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export const dyeingOrdersPlugin: FeaturePlugin = {
  key: 'dyeing-orders',
  route: 'dyeing-orders',
  label: 'Lệnh nhuộm',
  shortLabel: 'Nhuộm',
  description: 'Quản lý lệnh nhuộm và theo dõi trả hàng từ nhà nhuộm.',
  icon: 'droplet',
  primaryMobile: true,
  group: 'production',
  order: 58,
  component: () =>
    import('./DyeingOrdersPage').then((m) => ({ default: m.DyeingOrdersPage })),
};
