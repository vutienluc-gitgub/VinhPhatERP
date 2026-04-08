import type { SupplierDebt, SupplierDebtTransaction } from '@/schema';
import { untypedDb } from '@/services/supabase/untyped';

export type { SupplierDebt, SupplierDebtTransaction };

export async function fetchSupplierDebt(
  supplierId: string,
): Promise<SupplierDebt | null> {
  const { data, error } = await untypedDb
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
  const { data, error } = await untypedDb
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
  if (amount <= 0) throw new Error('Số tiền thanh toán phải lớn hơn 0');
  const { error } = await untypedDb.rpc('pay_supplier_debt', {
    p_supplier_id: supplierId,
    p_amount: amount,
    p_notes: notes,
  });
  if (error) throw error;
}
