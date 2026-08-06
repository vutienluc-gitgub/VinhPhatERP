import { supabase } from '@/services/supabase/client';
import type { Database } from '@/schema/database.types';

export type WorkOrderRow = Database['public']['Tables']['work_orders']['Row'];

/**
 * Fetch all work orders assigned to the logged-in supplier.
 */
export async function fetchSupplierWorkOrders(
  supplierId: string,
): Promise<WorkOrderRow[]> {
  const query = supabase
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (supplierId) {
    query.eq('supplier_id', supplierId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Fetch a single work order by ID for the supplier portal.
 */
export async function fetchSupplierWorkOrderById(
  workOrderId: string,
): Promise<WorkOrderRow> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', workOrderId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Action Engine API stubs for MES transitions.
 * In a fully realized MES, these would call atomic RPCs with capability & ledger checks.
 * For now, they perform basic status updates to allow UI development.
 */

export async function startWorkOrder(workOrderId: string): Promise<void> {
  const { error } = await supabase
    .from('work_orders')
    .update({ status: 'in_progress', start_date: new Date().toISOString() })
    .eq('id', workOrderId);

  if (error) throw new Error(`Failed to start work order: ${error.message}`);
}

export async function pauseWorkOrder(_workOrderId: string): Promise<void> {
  // In a real system, 'paused' might be a separate status or tracked via timeline events.
  // We'll leave this as a stub that could update a 'flag' or status.
  await Promise.resolve();
}

export async function resumeWorkOrder(_workOrderId: string): Promise<void> {
  await Promise.resolve();
}

export async function completeWorkOrder(workOrderId: string): Promise<void> {
  // Using the extended status 'pending_verification' we defined in types,
  // Note: If DB doesn't accept 'pending_verification', we fallback to 'completed' for UI testing
  const { error } = await supabase
    .from('work_orders')
    .update({ status: 'completed', end_date: new Date().toISOString() })
    .eq('id', workOrderId);

  if (error) throw new Error(`Failed to complete work order: ${error.message}`);
}

export async function confirmMaterialReceipt(
  _receiptId: string,
): Promise<void> {
  await Promise.resolve();
}
