import type { FeatureDefinition } from '@/shared/types/feature';

export * from '@/schema/shipping-rate.schema';

export const shippingRatesFeature: FeatureDefinition = {
  key: 'shipping-rates',
  route: '/shipping-rates',
  title: 'Giá cước vận chuyển',
  badge: 'New',
  description:
    'Quản lý bảng giá cước vận chuyển theo khu vực. Hỗ trợ tính giá cố định/chuyến, theo mét và theo kg.',
  highlights: [
    'Bảng giá cước theo khu vực giao hàng.',
    'Hỗ trợ 3 cách tính: cố định/chuyến, theo mét vải, theo kg.',
    'Phí bốc xếp riêng biệt.',
    'Chỉ admin mới quản lý được bảng giá.',
  ],
  resources: ['Bảng shipping_rates.'],
  entities: ['ShippingRate'],
  nextMilestones: [],
};

/* ── Helpers ── */

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const shippingRatesPlugin: FeaturePlugin = {
  key: 'shipping-rates',
  route: 'shipping-rates',
  label: 'Giá cước vận chuyển',
  shortLabel: 'Cước VC',
  description: 'Quản lý bảng giá cước vận chuyển theo khu vực.',
  icon: 'map-pin',
  requiredRoles: ['admin'],
  routeGuard: 'admin',
  group: 'system',
  order: 96,
  component: () =>
    import('./index').then((m) => ({ default: m.ShippingRatesPage })),
};
