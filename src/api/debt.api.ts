import type { CustomerDebt, DebtTransaction } from '@/schema';
import { untypedDb } from '@/services/supabase/untyped';

/**
 * Fetch a customer's overall debt status
 */
export async function fetchCustomerDebt(
  customerId: string,
): Promise<CustomerDebt | null> {
  const { data, error } = await untypedDb
    .from('customer_debt')
    .select('*')
    .eq('customer_id', customerId)
    .maybeSingle();

  if (error) throw error;
  return data as CustomerDebt | null;
}

/**
 * Fetch audit log of debt changes for a customer
 */
export async function fetchDebtTransactions(
  customerId: string,
): Promise<DebtTransaction[]> {
  const { data, error } = await untypedDb
    .from('debt_transactions')
    .select(
      `
      *,
      shipment:shipments(shipment_number)
    `,
    )
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as DebtTransaction[];
}

/**
 * Manual sync debt for a shipment (rarely used due to DB trigger)
 */
export async function syncShipmentDebtRPC(shipmentId: string): Promise<void> {
  const { error } = await untypedDb.rpc('sync_shipment_debt', {
    p_shipment_id: shipmentId,
  });

  if (error) throw error;
}

export async function payCustomerDebt(
  customerId: string,
  amount: number,
  notes: string,
): Promise<void> {
  if (amount <= 0) throw new Error('Số tiền thanh toán phải lớn hơn 0');
  const { error } = await untypedDb.rpc('pay_customer_debt', {
    p_customer_id: customerId,
    p_amount: amount,
    p_notes: notes,
  });
  if (error) throw error;
}
