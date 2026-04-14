import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const orderKanbanPlugin: FeaturePlugin = {
  key: 'order-kanban',
  route: 'order-kanban',
  label: 'Kanban Đơn Hàng',
  shortLabel: 'Kanban',
  description: 'Quản lý đơn hàng theo trạng thái trực quan.',
  icon: 'Columns3',
  requiredRoles: ['admin', 'manager', 'sale'],
  group: 'sales',
  order: 27,
  routes: [
    {
      path: 'order-kanban',
      component: () =>
        import('./index').then((m) => ({ default: m.OrderKanbanPage })),
    },
  ],
};
