import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

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

export const customersPlugin: FeaturePlugin = {
  key: 'customers',
  route: 'customers', // keep fallback to avoid errors if any other part expects it
  label: 'Khách hàng',
  shortLabel: 'Khách',
  description: 'Danh mục khách hàng và quản lý công nợ khách hàng.',
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
