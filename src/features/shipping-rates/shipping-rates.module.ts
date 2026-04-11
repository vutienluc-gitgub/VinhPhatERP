import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import { formatCurrency } from '@/shared/utils/format';
import type { ShippingRateFormValues } from '@/schema/shipping-rate.schema';

export { formatCurrency };
export type { ShippingRateFormValues };

export const shippingRatesFeature: FeatureDefinition = {
  key: 'shipping-rates',
  route: '/shipping-rates',
  title: 'Cấu hình Phí Ship',
  badge: 'Cost',
  description:
    'Quản lý bảng giá vận chuyển theo vùng miền, khối lượng và đơn vị vận chuyển.',
  summary: [
    {
      label: 'Vùng giá',
      value: '63 tỉnh',
    },
    {
      label: 'Đối tác vận chuyển',
      value: '5',
    },
  ],
  highlights: [
    'Tự động tính phí vận chuyển.',
    'Quản lý phụ phí vùng sâu.',
    'Lịch sử thay đổi giá.',
  ],
  entities: ['shipping_rates'],
  nextMilestones: ['Tự động cập nhật bảng giá từ API đối tác.'],
};

export const shippingRatesPlugin: FeaturePlugin = {
  key: 'shipping-rates',
  route: 'shipping-rates',
  label: 'Bảng phí Ship',
  shortLabel: 'Phí Ship',
  description:
    'Cấu hình đơn giá vận chuyển cho các khu vực và đối tác khác nhau.',
  icon: 'BadgeDollarSign',
  requiredRoles: ['admin', 'manager'],
  group: 'system',
  order: 110,
  component: () =>
    import('./ShippingRatesPage').then((m) => ({
      default: m.ShippingRatesPage,
    })),
};

export default createModule(shippingRatesFeature);
