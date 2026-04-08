import { z } from 'zod';

import { supabase } from '@/services/supabase/client';

export const supplierDebtTransactionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  reference_id: z.string().uuid().nullable(),
  reference_type: z.string().nullable(),
  type: z.enum(['purchase', 'payment', 'adjustment', 'return_credit']),
  amount: z.number(),
  balance_after: z.number().nullable(),
  notes: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
});

export type SupplierDebtTransaction = z.infer<
  typeof supplierDebtTransactionSchema
>;

export type SupplierDebt = {
  id: string;
  tenant_id: string;
  supplier_id: string;
  balance: number;
  notes: string | null;
  updated_at: string;
};

export async function fetchSupplierDebt(
  supplierId: string,
): Promise<SupplierDebt | null> {
  const { data, error } = await (supabase as any)
    .from('supplier_debt')
    .select('*')
    .eq('supplier_id', supplierId)
    .maybeSingle();

  if (error) throw error;
  return data as SupplierDebt | null;
}

export async function fetchSupplierDebtTransactions(
  supplierId: string,
): Promise<SupplierDebtTransaction[]> {
  const { data, error } = await (supabase as any)
    .from('supplier_debt_transactions')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupplierDebtTransaction[];
}

export async function paySupplierDebt(
  supplierId: string,
  amount: number,
  notes: string,
): Promise<void> {
  const { error } = await (supabase as any).rpc('pay_supplier_debt', {
    p_supplier_id: supplierId,
    p_amount: amount,
    p_notes: notes,
  });
  if (error) throw error;
}
