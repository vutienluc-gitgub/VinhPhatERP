import { z } from 'zod';

import { additionalCostSchema } from '@/schema/greige-price.schema';

/* ── Reference Type ── */

export const CostEstimationReferenceTypeEnum = z.enum([
  'work_order',
  'bom',
  'quotation',
]);

export type CostEstimationReferenceType = z.infer<
  typeof CostEstimationReferenceTypeEnum
>;

/* ── Create Input ── */

export const createCostEstimationSchema = z.object({
  reference_type: CostEstimationReferenceTypeEnum,
  reference_id: z.string().uuid('ID tham chieu khong hop le'),
  version: z.number().int().positive().optional(),
  target_width_cm: z
    .number()
    .positive('Kho vai phai > 0')
    .optional()
    .nullable(),
  target_gsm: z.number().positive('Dinh luong phai > 0').optional().nullable(),
  est_yarn_price: z.number().nonnegative('Gia soi phai >= 0'),
  est_profit_margin_pct: z.number().min(0).max(100).default(0),
  est_transport_cost: z.number().nonnegative().default(0),
  est_additional_costs: z.array(additionalCostSchema).default([]),
  est_total_cost: z.number().nonnegative('Tong chi phi phai >= 0'),
  suggested_price: z.number().nonnegative('Gia ban phai >= 0'),
});

export type CreateCostEstimationInput = z.infer<
  typeof createCostEstimationSchema
>;

/* ── DB Row Type (returned from Supabase) ── */

export interface CostEstimation {
  id: string;
  tenant_id: string;
  reference_type: CostEstimationReferenceType;
  reference_id: string;
  version: number;
  target_width_cm: number | null;
  target_gsm: number | null;
  est_yarn_price: number;
  est_profit_margin_pct: number;
  est_transport_cost: number;
  est_additional_costs: { key: string; label: string; amount: number }[];
  est_total_cost: number;
  suggested_price: number;
  created_at: string;
  created_by: string | null;
}
