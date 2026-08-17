import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import type {
  Payment,
  PaymentInsert,
  Expense,
  PaymentAccount,
} from '@/domain/payments/types';
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

import { PAYMENTS_MODULE_MESSAGES as MSG } from './payments.constants';

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
  title: MSG.TITLE,
  badge: 'Critical',
  description: MSG.DESC,
  summary: [
    {
      label: MSG.LBL_FUND,
      value: MSG.VAL_FUND,
    },
    {
      label: MSG.LBL_EXPENSE,
      value: MSG.VAL_EXPENSE,
    },
  ],
  highlights: [MSG.FEAT_1, MSG.FEAT_2, MSG.FEAT_3],
  entities: ['payments', 'payment_accounts', 'expenses'],
  nextMilestones: [MSG.ROADMAP_1, MSG.ROADMAP_2],
};

export default createModule(paymentsFeature);
