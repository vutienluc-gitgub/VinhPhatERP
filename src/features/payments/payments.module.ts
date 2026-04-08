import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import type { Expense, Payment, PaymentAccount, PaymentInsert } from '@/models';
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  accountDefaultValues,
  accountSchema,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  expenseDefaultValues,
  expenseSchema,
  PAYMENT_METHOD_LABELS,
  paymentsDefaultValues,
  paymentsSchema,
} from '@/schema/payment.schema';

export {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  accountDefaultValues,
  accountSchema,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  expenseDefaultValues,
  expenseSchema,
  PAYMENT_METHOD_LABELS,
  paymentsDefaultValues,
  paymentsSchema,
};

export type { Expense, Payment, PaymentAccount, PaymentInsert };
export type {
  PaymentsFormValues,
  AccountFormValues,
  ExpenseFormValues,
} from '@/schema/payment.schema';

export const paymentsFeature: FeatureDefinition = {
  key: 'payments',
  route: '/payments',
  title: 'Tài chính & Thanh toán',
  badge: 'Critical',
  description:
    'Quản lý thu chi, công nợ nhà cung cấp, nhật ký thanh toán và tài khoản ngân hàng.',
  summary: [
    {
      label: 'Số dư quỹ',
      value: '1.5 tỷ',
    },
    {
      label: 'Chi tháng này',
      value: '450 triệu',
    },
  ],
  highlights: [
    'Quản lý đa tài khoản.',
    'Theo dõi chi phí sản xuất.',
    'Đối soát công nợ tự động.',
  ],
  entities: ['payments', 'payment_accounts', 'expenses'],
  nextMilestones: [
    'Tích hợp cổng thanh toán API.',
    'Báo cáo lưu chuyển tiền tệ chi tiết.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const paymentsPlugin: FeaturePlugin = {
  key: 'payments',
  route: 'payments',
  label: 'Tài chính',
  shortLabel: 'Tiền',
  description: 'Quản lý chi phí, công nợ NCC và các giao dịch thanh toán.',
  icon: 'package',
  requiredRoles: ['admin', 'manager'],
  group: 'system',
  order: 100,
  component: () =>
    import('./PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
};

export const debtsPlugin: FeaturePlugin = {
  key: 'debts',
  route: 'debts',
  label: 'Công nợ',
  shortLabel: 'Công nợ',
  description: 'Quản lý nợ phải thu và nợ phải trả.',
  icon: 'credit-card',
  requiredRoles: ['admin', 'manager'],
  group: 'system',
  order: 101,
  component: () =>
    import('./DebtsPage').then((m) => ({ default: m.DebtsPage })),
};

export default createModule(paymentsFeature);
