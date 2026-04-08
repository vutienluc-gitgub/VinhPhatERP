import type { FeatureDefinition } from '@/shared/types/feature';

export * from '@/schema/order.schema';

export const ordersFeature: FeatureDefinition = {
  key: 'orders',
  route: '/orders',
  title: 'Đơn hàng',
  badge: 'Scaffolded',
  description:
    'Order là trung tâm nghiệp vụ của V2, tách rõ header, line items, due date, reservation và shipment downstream.',
  summary: [
    {
      label: 'Status set',
      value: '5',
    },
    {
      label: 'Shipment mode',
      value: 'Partial',
    },
    {
      label: 'Priority',
      value: 'Ready',
    },
  ],
  highlights: [
    'Cho phép giao nhiều lần cho một đơn hàng.',
    'Theo dõi ordered, reserved và shipped qty theo từng dòng.',
    'Filter trễ hạn, sắp đến hạn và theo khách hàng.',
  ],
  resources: [
    'Tao bang orders va order_items.',
    'UI list va detail mobile-first.',
    'Form order voi item repeater va validation.',
  ],
  entities: ['Order header', 'Order item', 'Reservation', 'Due date'],
  nextMilestones: [
    'Tao danh sach order voi state chips.',
    'Them detail page va line editor.',
    'Dong bo voi payments, progress va shipments.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const ordersPlugin: FeaturePlugin = {
  key: 'orders',
  route: 'orders',
  label: 'Đơn hàng',
  shortLabel: 'Orders',
  description: 'Quản lý đơn hàng, chi tiết dòng hàng, giữ chỗ và ngày giao.',
  icon: 'shopping-cart',
  primaryMobile: true,
  group: 'sales',
  order: 20,
  component: () => import('./index').then((m) => ({ default: m.OrdersPage })),
};
