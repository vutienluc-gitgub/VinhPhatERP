import type {
  WeavingInvoice,
  WeavingInvoiceFilter,
} from '@/features/weaving-invoices/types';
import type { WeavingInvoiceFormValues } from '@/schema/weaving-invoice.schema';
import { supabase } from '@/services/supabase/client';
import { untypedDb as db } from '@/services/supabase/untyped';
import { getTenantId } from '@/services/supabase/tenant';
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
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `GC${yy}${mm}-`;

  const { data, error } = await supabase
    .from(TABLE)
    .select('invoice_number')
    .ilike('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) {
    return `${prefix}001`;
  }

  if (!data || data.length === 0) return `${prefix}001`;

  const lastInvoice = data[0]?.invoice_number ?? '';
  const match = lastInvoice.match(new RegExp(`^${prefix}(\\d+)$`));
  if (!match?.[1]) return `${prefix}001`;

  const nextNum = parseInt(match[1], 10) + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
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
  const tenantId = await getTenantId();
  const invoiceNumber = values.invoice_number.trim();

  // 1. Database Safety: Check uniqueness of invoice_number
  const { data: exist, error: checkErr } = await supabase
    .from(TABLE)
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('invoice_number', invoiceNumber);

  if (checkErr) throw checkErr;
  if (exist && exist.length > 0) {
    throw new Error(
      `Số phiếu gia công "${invoiceNumber}" đã tồn tại. Vui lòng sử dụng số khác.`,
    );
  }

  // 2. Database Safety: Check if explicitly provided roll_numbers already exist in raw_fabric_rolls
  const explicitRollNumbers = values.rolls
    .map((r) => r.roll_number?.trim())
    .filter(Boolean) as string[];

  if (explicitRollNumbers.length > 0) {
    const { data: duplicateRolls, error: checkRollsErr } = await supabase
      .from('raw_fabric_rolls')
      .select('roll_number')
      .eq('tenant_id', tenantId)
      .in('roll_number', explicitRollNumbers);

    if (checkRollsErr) throw checkRollsErr;
    if (duplicateRolls && duplicateRolls.length > 0) {
      const dups = duplicateRolls.map((d) => d.roll_number).join(', ');
      throw new Error(
        `Các mã cuộn vải sau đã tồn tại trong kho mộc: ${dups}. Vui lòng nhập mã khác.`,
      );
    }
  }

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
    tenant_id: tenantId,
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

  const { data, error } = await db.rpc('rpc_create_weaving_invoice', {
    p_header: headerInsert,
    p_rolls: rollsInsert,
  });

  if (error) {
    if (
      error.code === '23505' ||
      error.message?.includes('duplicate key value')
    ) {
      throw new Error(
        `Lỗi dữ liệu: Số phiếu "${headerInsert.invoice_number}" bị trùng lặp.`,
      );
    }
    throw error;
  }
  return data as unknown as WeavingInvoice;
}

/* ── Update invoice (draft only) ── */

export async function updateWeavingInvoice(
  id: string,
  values: WeavingInvoiceFormValues,
): Promise<void> {
  const tenantId = await getTenantId();
  const invoiceNumber = values.invoice_number.trim();

  // 1. Database Safety: Check uniqueness of invoice_number internally
  const { data: exist, error: checkErr } = await supabase
    .from(TABLE)
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('invoice_number', invoiceNumber)
    .neq('id', id);

  if (checkErr) throw checkErr;
  if (exist && exist.length > 0) {
    throw new Error(
      `Số phiếu gia công "${invoiceNumber}" đã được sử dụng bởi phiếu khác.`,
    );
  }

  // 2. Database Safety: Check if explicitly provided roll_numbers already exist in raw_fabric_rolls
  const explicitRollNumbers = values.rolls
    .map((r) => r.roll_number?.trim())
    .filter(Boolean) as string[];

  if (explicitRollNumbers.length > 0) {
    const { data: duplicateRolls, error: checkRollsErr } = await supabase
      .from('raw_fabric_rolls')
      .select('roll_number')
      .eq('tenant_id', tenantId)
      .in('roll_number', explicitRollNumbers);

    if (checkRollsErr) throw checkRollsErr;
    if (duplicateRolls && duplicateRolls.length > 0) {
      const dups = duplicateRolls.map((d) => d.roll_number).join(', ');
      throw new Error(
        `Các mã cuộn vải sau đã tồn tại trong kho mộc: ${dups}. Vui lòng nhập mã khác hoặc để trống.`,
      );
    }
  }

  const headerUpdate = {
    invoice_number: invoiceNumber,
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

  const { error } = await db.rpc('rpc_update_weaving_invoice', {
    p_id: id,
    p_header: headerUpdate,
    p_rolls: rollsInsert,
  });

  if (error) {
    if (
      error.code === '23505' ||
      error.message?.includes('duplicate key value')
    ) {
      throw new Error(`Lỗi dữ liệu: Số phiếu "${invoiceNumber}" bị trùng lặp.`);
    }
    if (error.message?.includes('INVOICE_NOT_DRAFT'))
      throw new Error('Chỉ có thể cập nhật phiếu ở trạng thái nháp (draft).');
    throw error;
  }
}

/* ── Confirm invoice → trigger insert to raw_fabric_rolls ── */

export async function confirmWeavingInvoice(id: string): Promise<void> {
  const { error } = await db.rpc('rpc_confirm_weaving_invoice', {
    p_invoice_id: id,
  });
  if (error) {
    if (error.message?.includes('INVOICE_NOT_DRAFT'))
      throw new Error('Phiếu này đã được xác nhận rồi.');
    if (error.message?.includes('INVOICE_NOT_FOUND'))
      throw new Error('Không tìm thấy phiếu gia công.');
    if (
      error.code === '23505' ||
      error.message?.includes('duplicate key value')
    ) {
      throw new Error(
        'Lỗi dữ liệu kho mộc: Có ít nhất 1 mã cuộn trong phiếu này đã tồn tại trong kho. Vui lòng Huỷ xác nhận hoặc sửa lại mã cuộn trước khi nhập kho.',
      );
    }
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
