import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export const recurringTransactionsPlugin: FeaturePlugin = {
  key: 'recurring-transactions',
  route: 'recurring-transactions',
  label: 'Định kỳ',
  shortLabel: 'Định kỳ',
  description:
    'Quản lý nghiệp vụ định kỳ — tự động tạo phiếu chi thuê kho, lương hàng tháng.',
  icon: 'CalendarClock',
  requiredRoles: ['admin', 'manager'],
  group: 'finance',
  order: 102,
  routes: [
    {
      path: 'recurring-transactions',
      component: () =>
        import('./RecurringTransactionList').then((m) => ({
          default: m.RecurringTransactionList,
        })),
    },
  ],
};
