import { z } from 'zod';

/**
 * Debt Transaction Types
 */
export const DEBT_TRANSACTION_TYPES = [
  'shipment',
  'payment',
  'adjustment',
  'return_credit',
] as const;
export type DebtTransactionType = (typeof DEBT_TRANSACTION_TYPES)[number];

export const DEBT_TRANSACTION_LABELS: Record<DebtTransactionType, string> = {
  shipment: 'Xuất kho',
  payment: 'Thanh toán',
  adjustment: 'Điều chỉnh',
  return_credit: 'Trả hàng',
};

/**
 * Customer Debt Schema (Overall Balance)
 */
export const customerDebtSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  balance: z.number(),
  credit_limit: z.number().default(0),
  notes: z.string().nullable(),
  updated_at: z.string(),
});

/**
 * Debt Transaction Schema (Audit Log)
 */
export const debtTransactionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  shipment_id: z.string().uuid().nullable(),
  invoice_id: z.string().uuid().nullable(),
  type: z.enum(DEBT_TRANSACTION_TYPES),
  amount: z.number(),
  balance_after: z.number().nullable(),
  notes: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
});

export type CustomerDebt = z.infer<typeof customerDebtSchema>;
export type DebtTransaction = z.infer<typeof debtTransactionSchema>;
