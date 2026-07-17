import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import { formatCurrency } from '@/shared/utils/format';
import type { ShippingRateFormValues } from '@/schema/shipping-rate.schema';

import { SHIPPING_RATE_LABELS as MSG } from './shipping-rates.constants';

export { formatCurrency };
export type { ShippingRateFormValues };

export const shippingRatesFeature: FeatureDefinition = {
  key: 'shipping-rates',
  route: '/shipping-rates',
  title: MSG.MODULE_TITLE,
  badge: 'Cost',
  description: MSG.MODULE_DESC,
  summary: [
    {
      label: MSG.REGION_PRICE_LABEL,
      value: MSG.REGION_PRICE_VALUE,
    },
    {
      label: MSG.SHIPPING_PARTNER_LABEL,
      value: '5',
    },
  ],
  highlights: [
    MSG.FEATURE_AUTO_CALC,
    MSG.FEATURE_SURCHARGE,
    MSG.FEATURE_HISTORY,
  ],
  entities: ['shipping_rates'],
  nextMilestones: [MSG.MILESTONE_API],
};

export const shippingRatesPlugin: FeaturePlugin = {
  key: 'shipping-rates',
  route: 'shipping-rates',
  label: MSG.PLUGIN_LABEL,
  shortLabel: MSG.PLUGIN_SHORT_LABEL,
  description: MSG.PLUGIN_DESC,
  icon: 'Truck',
  requiredRoles: ['admin', 'manager'],
  group: 'finance',
  order: 110,
  routes: [
    {
      path: 'shipping-rates',
      component: () =>
        import('./ShippingRatesPage').then((m) => ({
          default: m.ShippingRatesPage,
        })),
    },
  ],
};

export default createModule(shippingRatesFeature);
