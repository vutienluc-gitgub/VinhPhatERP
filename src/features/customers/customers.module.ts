import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

import { CUSTOMER_MODULE_LABELS } from './customers.constants';

export const customersFeature: FeatureDefinition = {
  key: 'customers',
  route: '/customers',
  title: CUSTOMER_MODULE_LABELS.title,
  badge: 'Stable',
  description: CUSTOMER_MODULE_LABELS.subTitle,
  summary: [
    {
      label: CUSTOMER_MODULE_LABELS.menuAllCustomers,
      value: '120',
    },
    {
      label: CUSTOMER_MODULE_LABELS.menuActiveCustomers,
      value: '98',
    },
  ],
  highlights: [
    CUSTOMER_MODULE_LABELS.featureRanking,
    CUSTOMER_MODULE_LABELS.featureDebtWarning,
    CUSTOMER_MODULE_LABELS.featureSalesTracking,
  ],
  entities: ['customers'],
  nextMilestones: [
    CUSTOMER_MODULE_LABELS.featureCRM,
    CUSTOMER_MODULE_LABELS.featurePortal,
  ],
};

export const customersPlugin: FeaturePlugin = {
  key: 'customers',
  route: 'customers', // keep fallback to avoid errors if any other part expects it
  label: CUSTOMER_MODULE_LABELS.title,
  shortLabel: 'Kinh doanh',
  description: CUSTOMER_MODULE_LABELS.description,
  icon: 'UserCheck',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'sales',
  order: 60,
  routes: [
    {
      path: 'customers',
      component: () =>
        import('./CustomersPage').then((m) => ({ default: m.CustomersPage })),
    },
    // Ví dụ minh hoạ Nested Route (Tạo mới) - nếu có module thật
    // {
    //   path: 'customers/create',
    //   component: () => import('./CustomerCreate').then((m) => ({ default: m.CustomerCreate })),
    // }
  ],
};

export default createModule(customersFeature);
