import { lazy } from 'react';

import { createModule } from '@/core/registry/moduleRegistry';
import { LazyPage } from '@/app/router/LazyPage';

const CustomersPage = lazy(() =>
  import('./CustomersPage').then((m) => ({ default: m.CustomersPage })),
);

export const customersModule = createModule({
  key: 'module-customers',
  name: 'Khách Hàng',
  routes: [
    {
      path: '/customers',
      element: (
        <LazyPage>
          <CustomersPage />
        </LazyPage>
      ),
    },
  ],
  menu: [
    {
      path: '/customers',
      label: 'Khách hàng',
      shortLabel: 'CRM',
      description: 'Quản lý thông tin khách hàng, nợ công và lịch sử mua hàng.',
      icon: 'users',
      primaryMobile: true,
      group: 'sales',
      order: 40,
    },
  ],
});

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const customersPlugin: FeaturePlugin = {
  key: 'customers',
  route: 'customers',
  label: 'Khách hàng',
  shortLabel: 'CRM',
  description: 'Quản lý thông tin khách hàng, nợ công và lịch sử mua hàng.',
  icon: 'users',
  primaryMobile: true,
  group: 'sales',
  order: 40,
  component: () =>
    import('./CustomersPage').then((m) => ({ default: m.CustomersPage })),
};
