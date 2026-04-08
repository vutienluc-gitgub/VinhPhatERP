import type { FeatureDefinition } from '@/shared/types/feature';

export {
  PAYMENT_METHOD_LABELS,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  paymentsSchema,
  paymentsDefaultValues,
  expenseSchema,
  expenseDefaultValues,
  accountSchema,
  accountDefaultValues,
} from '@/schema/payment.schema';
export type {
  PaymentMethod,
  AccountType,
  ExpenseCategory,
  PaymentsFormValues,
  ExpenseFormValues,
  AccountFormValues,
} from '@/schema/payment.schema';

export const paymentsFeature: FeatureDefinition = {
  key: 'payments',
  route: '/payments',
  title: 'Thu Chi',
  badge: 'Active',
  description:
    'Module thu chi toàn diện: phiếu thu, phiếu chi, tài khoản, dòng tiền và công nợ.',
  highlights: [
    'Quản lý phiếu thu từ đơn hàng khách hàng.',
    'Quản lý phiếu chi cho nhà cung cấp và chi phí vận hành.',
    'Theo dõi dòng tiền và công nợ realtime.',
    'Tự động cập nhật số dư tài khoản.',
  ],
  resources: [
    'Bảng payments, expenses, payment_accounts.',
    'Trigger tự động sync paid_amount và account balance.',
    'RPC get_cash_flow_summary, get_expense_by_category.',
    'View v_supplier_debt, v_debt_by_customer.',
  ],
  entities: ['Payment', 'Expense', 'PaymentAccount', 'DebtSummary', 'CashFlow'],
  nextMilestones: [
    'Dashboard tài chính tổng hợp.',
    'Báo cáo lãi lỗ theo tháng.',
    'Xuất báo cáo thu chi Excel/PDF.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const paymentsPlugin: FeaturePlugin = {
  key: 'payments',
  route: 'payments',
  label: 'Thu Chi',
  shortLabel: 'Thu Chi',
  description: 'Quản lý thu chi, phiếu thu, phiếu chi và dòng tiền.',
  icon: 'wallet',
  group: 'system',
  order: 90,
  component: () => import('./index').then((m) => ({ default: m.PaymentsPage })),
};

export const debtsPlugin: FeaturePlugin = {
  key: 'debts',
  route: 'debts',
  label: 'Công nợ',
  shortLabel: 'Nợ',
  description: 'Theo dõi công nợ khách hàng và nhà cung cấp.',
  icon: 'credit-card',
  group: 'system',
  order: 91,
  component: () => import('./index').then((m) => ({ default: m.DebtsPage })),
};
