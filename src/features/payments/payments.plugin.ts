import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';

export const paymentsPlugin: FeaturePlugin = {
  key: 'payments',
  route: 'payments',
  label: 'Tài chính',
  shortLabel: 'Tiền',
  description: 'Quản lý chi phí, công nợ NCC và các giao dịch thanh toán.',
  icon: 'CircleDollarSign',
  requiredRoles: ['admin', 'manager'],
  group: 'system',
  order: 100,
  routes: [
    {
      path: 'payments',
      component: () =>
        import('./PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
    },
  ],
};

export const debtsPlugin: FeaturePlugin = {
  key: 'debts',
  route: 'debts',
  label: 'Công nợ',
  shortLabel: 'Công nợ',
  description: 'Quản lý nợ phải thu và nợ phải trả.',
  icon: 'CreditCard',
  requiredRoles: ['admin', 'manager'],
  group: 'system',
  order: 101,
  routes: [
    {
      path: 'debts',
      component: () =>
        import('./DebtsPage').then((m) => ({ default: m.DebtsPage })),
    },
  ],
};
