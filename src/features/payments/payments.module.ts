import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'
import type { AccountType, ExpenseCategory, PaymentMethod } from './types'

/* ── Payment method constants ── */

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  check: 'Séc',
  other: 'Khác',
}

/* ── Account type constants ── */

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
}

export const ACCOUNT_TYPES = ['cash', 'bank'] as const

/* ── Expense category constants ── */

export const EXPENSE_CATEGORIES = [
  'supplier_payment',
  'yarn_purchase',
  'weaving_cost',
  'dyeing_cost',
  'salary',
  'rent',
  'utilities',
  'logistics',
  'equipment',
  'other',
] as const

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  supplier_payment: 'Trả nhà cung cấp',
  yarn_purchase: 'Mua sợi',
  weaving_cost: 'Chi phí dệt',
  dyeing_cost: 'Chi phí nhuộm',
  salary: 'Lương nhân viên',
  rent: 'Thuê mặt bằng',
  utilities: 'Điện / Nước / Internet',
  logistics: 'Vận chuyển',
  equipment: 'Thiết bị / Bảo trì',
  other: 'Chi phí khác',
}

/* ── Payment (Thu) Zod schema ── */

export const paymentsSchema = z.object({
  paymentNumber: z.string().trim().min(3, 'Nhập số phiếu thu'),
  orderId: z.string().uuid('Chọn đơn hàng'),
  customerId: z.string().uuid('Chọn khách hàng'),
  paymentDate: z.string().trim().min(1, 'Chọn ngày thu'),
  amount: z.number().positive('Số tiền phải > 0'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'other']),
  accountId: z.string().uuid().optional().or(z.literal('')),
  referenceNumber: z.string().trim().max(120).optional().or(z.literal('')),
})

export type PaymentsFormValues = z.infer<typeof paymentsSchema>

export const paymentsDefaultValues: PaymentsFormValues = {
  paymentNumber: '',
  orderId: '',
  customerId: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  paymentMethod: 'bank_transfer',
  accountId: '',
  referenceNumber: '',
}

/* ── Expense (Chi) Zod schema ── */

export const expenseSchema = z.object({
  expenseNumber: z.string().trim().min(3, 'Nhập số phiếu chi'),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive('Số tiền phải > 0'),
  expenseDate: z.string().trim().min(1, 'Chọn ngày chi'),
  accountId: z.string().uuid().optional().or(z.literal('')),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  description: z.string().trim().min(2, 'Nhập mô tả chi phí'),
  referenceNumber: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>

export const expenseDefaultValues: ExpenseFormValues = {
  expenseNumber: '',
  category: 'other',
  amount: 0,
  expenseDate: new Date().toISOString().slice(0, 10),
  accountId: '',
  supplierId: '',
  description: '',
  referenceNumber: '',
  notes: '',
}

/* ── Payment Account Zod schema ── */

export const accountSchema = z.object({
  name: z.string().trim().min(2, 'Tên tài khoản tối thiểu 2 ký tự'),
  type: z.enum(ACCOUNT_TYPES),
  bankName: z.string().trim().optional().or(z.literal('')),
  accountNumber: z.string().trim().optional().or(z.literal('')),
  initialBalance: z.number().min(0, 'Số dư không được âm'),
  notes: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
})

export type AccountFormValues = z.infer<typeof accountSchema>

export const accountDefaultValues: AccountFormValues = {
  name: '',
  type: 'bank',
  bankName: '',
  accountNumber: '',
  initialBalance: 0,
  notes: '',
  status: 'active',
}

/* ── Feature definition ── */

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
}