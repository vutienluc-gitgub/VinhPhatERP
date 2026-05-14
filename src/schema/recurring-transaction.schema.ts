import { z } from 'zod';

import { EXPENSE_CATEGORIES } from '@/schema/payment.schema';

// ─── Frequency ────────────────────────────────────────────────────────────────

export const RECURRING_FREQUENCIES = [
  'monthly',
  'quarterly',
  'yearly',
] as const;

export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

// ─── Schema ───────────────────────────────────────────────────────────────────

export const recurringTransactionSchema = z.object({
  name: z.string().trim().min(2, 'Tên nghiệp vụ tối thiểu 2 ký tự'),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive('Số tiền phải > 0'),
  frequency: z.enum(RECURRING_FREQUENCIES),
  dayOfMonth: z
    .number()
    .int()
    .min(1, 'Ngày trong tháng phải từ 1')
    .max(31, 'Ngày trong tháng tối đa 31'),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  employeeId: z.string().uuid().optional().or(z.literal('')),
  accountId: z.string().uuid().optional().or(z.literal('')),
  description: z.string().trim().min(2, 'Nhập mô tả chi phí'),
  notes: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  nextRunDate: z.string().trim().min(1, 'Chọn ngày bắt đầu'),
});

export type RecurringTransactionFormValues = z.infer<
  typeof recurringTransactionSchema
>;

export const recurringTransactionDefaultValues: RecurringTransactionFormValues =
  {
    name: '',
    category: 'rent',
    amount: 0,
    frequency: 'monthly',
    dayOfMonth: 1,
    supplierId: '',
    employeeId: '',
    accountId: '',
    description: '',
    notes: '',
    isActive: true,
    nextRunDate: new Date().toISOString().slice(0, 10),
  };
