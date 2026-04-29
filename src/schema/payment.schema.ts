import { z } from 'zod';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'check'
  | 'other'
  | 'customer_balance';
export type AccountType = 'cash' | 'bank';
export type ExpenseCategory =
  | 'supplier_payment'
  | 'yarn_purchase'
  | 'weaving_cost'
  | 'dyeing_cost'
  | 'salary'
  | 'rent'
  | 'utilities'
  | 'logistics'
  | 'equipment'
  | 'other';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  check: 'Séc',
  customer_balance: 'Số dư khách hàng',
  other: 'Khác',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
};

export const ACCOUNT_TYPES = ['cash', 'bank'] as const;

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
] as const;

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
};

export const paymentsSchema = z.object({
  paymentNumber: z.string().trim().optional().default(''),
  orderId: z.string().uuid('Chọn đơn hàng').optional().or(z.literal('')),
  customerId: z.string().uuid('Chọn khách hàng'),
  paymentDate: z.string().trim().min(1, 'Chọn ngày thu'),
  amount: z.number().positive('Số tiền phải > 0'),
  paymentMethod: z.enum([
    'cash',
    'bank_transfer',
    'check',
    'customer_balance',
    'other',
  ]),
  accountId: z.string().uuid().optional().or(z.literal('')),
  referenceNumber: z.string().trim().max(120).optional().or(z.literal('')),
});

export const paymentResponseSchema = z
  .object({
    id: z.string().uuid(),
    payment_number: z.string(),
    amount: z.number(),
  })
  .passthrough();

export type PaymentsFormValues = z.infer<typeof paymentsSchema>;

/**
 * Factory tạo schema có validate overpayment.
 * Nếu balanceDue được cung cấp, amount không được vượt quá balanceDue.
 */
export function createPaymentsSchema(balanceDue?: number) {
  return paymentsSchema.superRefine((data, ctx) => {
    if (balanceDue !== undefined && data.amount > balanceDue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: `Số tiền thu không được vượt quá số còn nợ (${new Intl.NumberFormat('vi-VN').format(balanceDue)} đ)`,
      });
    }
  });
}

export const paymentsDefaultValues: PaymentsFormValues = {
  paymentNumber: '',
  orderId: '',
  customerId: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  paymentMethod: 'bank_transfer',
  accountId: '',
  referenceNumber: '',
};

export const expenseSchema = z.object({
  expenseNumber: z.string().trim().optional().default(''),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive('Số tiền phải > 0'),
  expenseDate: z.string().trim().min(1, 'Chọn ngày chi'),
  accountId: z.string().uuid().optional().or(z.literal('')),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  employeeId: z.string().uuid().optional().or(z.literal('')),
  description: z.string().trim().min(2, 'Nhập mô tả chi phí'),
  referenceNumber: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
  allocations: z
    .array(
      z.object({
        document_type: z.enum(['weaving_invoice', 'yarn_receipt']),
        document_id: z.string().uuid(),
        allocated_amount: z.number().positive(),
      }),
    )
    .optional()
    .default([]),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const expenseDefaultValues: ExpenseFormValues = {
  expenseNumber: '',
  category: 'other',
  amount: 0,
  expenseDate: new Date().toISOString().slice(0, 10),
  accountId: '',
  supplierId: '',
  employeeId: '',
  description: '',
  referenceNumber: '',
  notes: '',
  allocations: [],
};

export const accountSchema = z.object({
  name: z.string().trim().min(2, 'Tên tài khoản tối thiểu 2 ký tự'),
  type: z.enum(ACCOUNT_TYPES),
  bankName: z.string().trim().optional().or(z.literal('')),
  accountNumber: z.string().trim().optional().or(z.literal('')),
  initialBalance: z.number().min(0, 'Số dư không được âm'),
  notes: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

export const accountDefaultValues: AccountFormValues = {
  name: '',
  type: 'bank',
  bankName: '',
  accountNumber: '',
  initialBalance: 0,
  notes: '',
  status: 'active',
};
