import { lazy } from 'react';

import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import { LazyPage } from '@/app/router/LazyPage';

export const customersFeature: FeatureDefinition = {
  key: 'customers',
  route: '/customers',
  title: 'Khách hàng',
  badge: 'Stable',
  description:
    'Quản lý danh sách khách hàng, hợp đồng, bảng giá và phân hạng đối tác.',
  summary: [
    {
      label: 'Tổng khách hàng',
      value: '120',
    },
    {
      label: 'Đang hoạt động',
      value: '98',
    },
  ],
  highlights: [
    'Phân hạng Gold/Silver/Bronze.',
    'Cảnh báo hạn mức nợ.',
    'Theo dõi doanh số luỹ kế.',
  ],
  entities: ['customers'],
  nextMilestones: [
    'Tính năng CRM chăm sóc khách hàng tự động.',
    'Portal khách hàng tra cứu đơn hàng.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const customersPlugin: FeaturePlugin = {
  key: 'customers',
  route: 'customers',
  label: 'Khách hàng',
  shortLabel: 'Khách',
  description: 'Danh mục khách hàng và quản lý công nợ khách hàng.',
  icon: 'users',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'partners',
  order: 60,
  component: () =>
    import('./CustomersPage').then((m) => ({ default: m.CustomersPage })),
};

export default createModule(customersFeature);
