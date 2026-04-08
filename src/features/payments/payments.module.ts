import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import type { Expense, Payment, PaymentAccount, PaymentInsert } from '@/models';

export type { Expense, Payment, PaymentAccount, PaymentInsert };

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
  group: 'finance',
  order: 100,
  component: () =>
    import('./PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
};

export default createModule(paymentsFeature);
