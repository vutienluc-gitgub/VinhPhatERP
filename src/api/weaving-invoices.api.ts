import type {
  WeavingInvoice,
  WeavingInvoiceFilter,
} from '@/features/weaving-invoices/types';
import type { WeavingInvoiceFormValues } from '@/schema/weaving-invoice.schema';
import { supabase } from '@/services/supabase/client';
import { untypedDb as db } from '@/services/supabase/untyped';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';

const TABLE = 'weaving_invoices';

/* ── List (paginated) ── */

export async function fetchWeavingInvoicesPaginated(
  filters: WeavingInvoiceFilter = {},
  page = 1,
): Promise<PaginatedResult<WeavingInvoice>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = db
    .from(TABLE)
    .select('*, suppliers(name, code)', { count: 'exact' })
    .order('invoice_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
  if (filters.search?.trim())
    query = query.ilike('invoice_number', `%${filters.search.trim()}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as unknown as WeavingInvoice[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

/* ── Single invoice with rolls ── */

export async function fetchWeavingInvoiceById(
  id: string,
): Promise<WeavingInvoice> {
  const { data, error } = await db
    .from(TABLE)
    .select('*, suppliers(name, code), weaving_invoice_rolls(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as WeavingInvoice;
}

/* ── Next invoice number ── */

export async function fetchNextWeavingInvoiceNumber(): Promise<string> {
  const { data, error } = await db.rpc('next_weaving_invoice_number');
  if (error) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `GC${yy}${mm}-001`;
  }
  return (data as string) ?? 'GC0001-001';
}

/* ── Fetch weaving suppliers ── */

export async function fetchWeavingSuppliers(): Promise<
  { id: string; code: string; name: string }[]
> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, code, name')
    .eq('category', 'weaving')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as { id: string; code: string; name: string }[];
}

/* ── Create invoice (header + rolls as draft) ── */

export async function createWeavingInvoice(
  values: WeavingInvoiceFormValues,
): Promise<WeavingInvoice> {
  const { data: userData } = await supabase.auth.getUser();

  // Fetch supplier code for roll_number prefix (read-only, before transaction)
  const { data: supplierData, error: supplierErr } = await supabase
    .from('suppliers')
    .select('code')
    .eq('id', values.supplier_id)
    .single();
  if (supplierErr) throw supplierErr;
  const supplierCode = supplierData?.code ?? 'SUP';

  const headerInsert = {
    invoice_number: values.invoice_number.trim(),
    supplier_id: values.supplier_id,
    invoice_date: values.invoice_date,
    fabric_type: values.fabric_type.trim(),
    unit_price_per_kg: values.unit_price_per_kg,
    notes: values.notes?.trim() || null,
    status: 'draft',
    created_by: userData.user?.id ?? null,
  };

  const rollsInsert = values.rolls.map((r, idx) => ({
    roll_number:
      r.roll_number?.trim() || `${supplierCode}-${Date.now()}-${idx + 1}`,
    weight_kg: r.weight_kg,
    length_m: r.length_m ?? null,
    quality_grade: r.quality_grade ?? null,
    warehouse_location: r.warehouse_location?.trim() || null,
    lot_number: r.lot_number?.trim() || null,
    notes: r.notes?.trim() || null,
    sort_order: idx,
  }));

  const { data, error } = await db.rpc('atomic_create_weaving_invoice', {
    p_header: headerInsert,
    p_rolls: rollsInsert,
  });

  if (error) throw error;
  return data as unknown as WeavingInvoice;
}

/* ── Update invoice (draft only) ── */

export async function updateWeavingInvoice(
  id: string,
  values: WeavingInvoiceFormValues,
): Promise<void> {
  const headerUpdate = {
    invoice_number: values.invoice_number.trim(),
    supplier_id: values.supplier_id,
    invoice_date: values.invoice_date,
    fabric_type: values.fabric_type.trim(),
    unit_price_per_kg: values.unit_price_per_kg,
    notes: values.notes?.trim() || null,
  };

  const rollsInsert = values.rolls.map((r, idx) => ({
    roll_number: r.roll_number.trim(),
    weight_kg: r.weight_kg,
    length_m: r.length_m ?? null,
    quality_grade: r.quality_grade ?? null,
    warehouse_location: r.warehouse_location?.trim() || null,
    lot_number: r.lot_number?.trim() || null,
    notes: r.notes?.trim() || null,
    sort_order: idx,
  }));

  const { error } = await db.rpc('atomic_update_weaving_invoice', {
    p_id: id,
    p_header: headerUpdate,
    p_rolls: rollsInsert,
  });

  if (error) {
    if (error.message?.includes('INVOICE_NOT_DRAFT'))
      throw new Error('Chi co the cap nhat phieu nhap o trang thai nhap.');
    throw error;
  }
}

/* ── Confirm invoice → trigger insert to raw_fabric_rolls ── */

export async function confirmWeavingInvoice(id: string): Promise<void> {
  const { error } = await db.rpc('confirm_weaving_invoice', {
    p_invoice_id: id,
  });
  if (error) {
    if (error.message?.includes('INVOICE_NOT_DRAFT'))
      throw new Error('Phiếu này đã được xác nhận rồi.');
    if (error.message?.includes('INVOICE_NOT_FOUND'))
      throw new Error('Không tìm thấy phiếu gia công.');
    throw error;
  }
}

/* ── Mark as paid ── */

export async function markWeavingInvoicePaid(
  id: string,
  paidAmount: number,
): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .update({
      paid_amount: paidAmount,
      status: 'paid',
    })
    .eq('id', id);
  if (error) throw error;
}

/* ── Delete (draft only) ── */

export async function deleteWeavingInvoice(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/* ── Supplier debt view ── */

export type WeavingSupplierDebtRow = {
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  category: string;
  total_invoiced: number;
  total_paid: number;
  balance_due: number;
  invoice_count: number;
};

export async function fetchWeavingSupplierDebt(): Promise<
  WeavingSupplierDebtRow[]
> {
  const { data, error } = await db.from('v_supplier_debt').select('*');
  if (error) throw error;
  return (data ?? []) as WeavingSupplierDebtRow[];
}
