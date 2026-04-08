import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  orderItemSchema,
  ordersSchema,
  ordersDefaultValues,
  emptyOrderItem,
  UNIT_OPTIONS,
} from '@/schema/order.schema';
import type { OrderStatus } from '@/schema/order.schema';

export {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  orderItemSchema,
  ordersSchema,
  ordersDefaultValues,
  emptyOrderItem,
  UNIT_OPTIONS,
};
export type { OrderStatus };
export type { OrdersFormValues } from '@/schema/order.schema';

export const ordersFeature: FeatureDefinition = {
  key: 'orders',
  route: '/orders',
  title: 'Đơn hàng (Sales)',
  badge: 'Hot',
  description:
    'Hệ thống quản lý đơn hàng bán, quy trình duyệt và theo dõi tiến độ sản xuất.',
  summary: [
    {
      label: 'Đang xử lý',
      value: '128',
    },
    {
      label: 'Doanh thu tháng',
      value: '4.2 tỷ',
    },
  ],
  highlights: [
    'Tự động tính toán nhu cầu nguyên liệu.',
    'Luồng phê duyệt 3 bước linh hoạt.',
    'Theo dõi tiến độ đơn hàng thời gian thực.',
  ],
  entities: ['orders', 'order_items'],
  nextMilestones: [
    'Tự động dự báo ngày giao hàng (AI).',
    'Tích hợp cổng thông tin khách hàng.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const ordersPlugin: FeaturePlugin = {
  key: 'orders',
  route: 'orders',
  label: 'Đơn bán hàng',
  shortLabel: 'Đơn hàng',
  description:
    'Quản lý đơn hàng kinh doanh, theo dõi tiến độ và công nợ khách hàng.',
  icon: 'package',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'sales',
  order: 10,
  component: () =>
    import('./OrdersPage').then((m) => ({ default: m.OrdersPage })),
};

export default createModule(ordersFeature);
