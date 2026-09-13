import type {
  YarnReceipt,
  YarnReceiptsFilter,
} from '@/domain/inventory/yarn-receipts.types';
import { supabase } from '@/services/supabase/client';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { validateApiInput } from '@/lib/validate-api-input';
import { assertSingleMutation } from '@/lib/db-mutation-guard';
import { apiYarnReceiptInput } from '@/schema/api-validation.schema';
import { FORM_MESSAGES } from '@/features/yarn-receipts/yarn-receipts.constants';

const HEADER_TABLE = 'yarn_receipts';

export type YarnSupplierOption = { id: string; code: string; name: string };

export type YarnCatalogOption = {
  id: string;
  code: string;
  name: string;
  composition: string | null;
  color_name: string | null;
  tensile_strength: string | null;
  origin: string | null;
  grade: string | null;
  unit: string;
};

export async function fetchYarnReceiptsPaginated(
  filters: YarnReceiptsFilter = {},
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<YarnReceipt>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(HEADER_TABLE)
    .select('*, suppliers(name, code), yarn_receipt_items(unit_price)', {
      count: 'exact',
    })
    .order('receipt_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
  if (filters.dateFrom) query = query.gte('receipt_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('receipt_date', filters.dateTo);
  if (filters.search?.trim()) {
    const q = filters.search.trim();

    // Buoc 1: Tim nha cung cap co ten khop tu khoa
    const { data: matchedSuppliers } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('name', `%${q}%`);

    const supplierIds = (matchedSuppliers ?? []).map((s) => s.id);

    // Buoc 2: Ket hop OR tren bang chinh (receipt_number, notes, supplier_id)
    if (supplierIds.length > 0) {
      query = query.or(
        `receipt_number.ilike.%${q}%,notes.ilike.%${q}%,supplier_id.in.(${supplierIds.join(',')})`,
      );
    } else {
      query = query.or(`receipt_number.ilike.%${q}%,notes.ilike.%${q}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as unknown as YarnReceipt[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function fetchYarnReceiptById(id: string): Promise<YarnReceipt> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('*, suppliers(name, code), yarn_receipt_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as YarnReceipt;
}

export async function fetchNextReceiptNumber(): Promise<string> {
  const { fetchNextDocNumber } = await import('@/api/helpers/next-doc-number');
  return fetchNextDocNumber({
    table: 'yarn_receipts',
    column: 'receipt_number',
    prefix: 'NS-',
    pad: 3,
  });
}

export async function fetchYarnSuppliers(): Promise<YarnSupplierOption[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, code, name')
    .eq('category', 'YARN')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as YarnSupplierOption[];
}

export async function fetchYarnCatalogOptionsForReceipt(): Promise<
  YarnCatalogOption[]
> {
  const { data, error } = await supabase
    .from('yarn_catalogs')
    .select(
      'id, code, name, composition, color_name, tensile_strength, origin, grade, unit',
    )
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as YarnCatalogOption[];
}

export type YarnReceiptCreateInput = {
  /** Only used for updates; create auto-generates via RPC */
  receiptNumber?: string;
  supplierId: string;
  receiptDate: string;
  notes: string | null;
  vehicleInfo?: string | null;
  additionalFees?: { name: string; amount: number }[];
  items: {
    yarnType: string;
    colorName: string | null;
    quantity: number;
    unitPrice: number;
    lotNumber: string | null;
    grade: string | null;
    unit: string;
    tensileStrength: string | null;
    composition: string | null;
    origin: string | null;
    yarnCatalogId: string | null;
    netWeight: number | null;
    grossWeight: number | null;
    serialNumber: string | null;
    productionWeek: number | null;
    dist: string | null;
  }[];
};

export async function createYarnReceiptFull(
  input: YarnReceiptCreateInput,
): Promise<YarnReceipt> {
  validateApiInput(apiYarnReceiptInput.passthrough(), input);
  const { getTenantId } = await import('@/services/supabase/tenant');
  const tenantId = await getTenantId();

  const total = input.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );

  const headerInsert = {
    supplier_id: input.supplierId,
    receipt_date: input.receiptDate,
    notes: input.notes,
    status: 'draft',
    total_amount: total,
    tenant_id: tenantId,
    vehicle_info: input.vehicleInfo || null,
    additional_fees: input.additionalFees || [],
  };

  const itemsInsert = input.items.map((item, idx) => ({
    yarn_type: item.yarnType.trim(),
    color_name: item.colorName?.trim() || null,
    unit: item.unit.trim(),
    quantity: item.quantity,
    unit_price: item.unitPrice,
    lot_number: item.lotNumber?.trim() || null,
    grade: item.grade?.trim() || null,
    tensile_strength: item.tensileStrength?.trim() || null,
    composition: item.composition?.trim() || null,
    origin: item.origin?.trim() || null,
    yarn_catalog_id: item.yarnCatalogId?.trim() || null,
    sort_order: idx,
    net_weight: item.netWeight ?? null,
    gross_weight: item.grossWeight ?? null,
    serial_number: item.serialNumber?.trim() || null,
    production_week: item.productionWeek ?? null,
    dist: item.dist?.trim() || null,
  }));

  const { data, error } = await supabase.rpc('rpc_create_yarn_receipt', {
    p_header: headerInsert as unknown as never,
    p_items: itemsInsert as unknown as never[],
  });

  if (error) throw error;
  return data as unknown as YarnReceipt;
}

export async function updateYarnReceiptFull(
  id: string,
  input: YarnReceiptCreateInput,
  expectedUpdatedAt?: string,
): Promise<void> {
  const { getTenantId } = await import('@/services/supabase/tenant');
  const tenantId = await getTenantId();

  const total = input.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );

  const headerUpdate = {
    receipt_number: input.receiptNumber?.trim() || null,
    supplier_id: input.supplierId,
    receipt_date: input.receiptDate,
    notes: input.notes || null,
    total_amount: total,
    tenant_id: tenantId,
    vehicle_info: input.vehicleInfo || null,
    additional_fees: input.additionalFees || [],
  };

  const itemsInsert = input.items.map((item, idx) => ({
    yarn_type: item.yarnType.trim(),
    color_name: item.colorName?.trim() || null,
    unit: item.unit.trim(),
    quantity: item.quantity,
    unit_price: item.unitPrice,
    lot_number: item.lotNumber?.trim() || null,
    grade: item.grade?.trim() || null,
    tensile_strength: item.tensileStrength?.trim() || null,
    composition: item.composition?.trim() || null,
    origin: item.origin?.trim() || null,
    yarn_catalog_id: item.yarnCatalogId?.trim() || null,
    sort_order: idx,
    net_weight: item.netWeight ?? null,
    gross_weight: item.grossWeight ?? null,
    serial_number: item.serialNumber?.trim() || null,
    production_week: item.productionWeek ?? null,
    dist: item.dist?.trim() || null,
  }));

  const { error } = await supabase.rpc('rpc_update_yarn_receipt', {
    p_id: id,
    p_header: headerUpdate as unknown as never,
    p_items: itemsInsert as unknown as never[],
    p_expected_updated_at: expectedUpdatedAt,
  });

  if (error) {
    if (error.message?.includes('OCC_MISMATCH')) {
      throw new Error(
        'Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.',
      );
    }
    throw error;
  }
}
export async function deleteYarnReceiptRecord(
  id: string,
  expectedUpdatedAt?: string,
): Promise<void> {
  let query = supabase
    .from(HEADER_TABLE)
    .delete()
    .eq('id', id)
    .eq('status', 'draft');

  if (expectedUpdatedAt) {
    query = query.eq('updated_at', expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();
  assertSingleMutation(data, error, {
    entityName: 'Phiếu nhập sợi',
    expectedStatus: 'draft',
    expectedUpdatedAt,
    transitionName: 'xóa phiếu nhập sợi',
  });
}

export async function confirmYarnReceipt(
  id: string,
  expectedUpdatedAt?: string,
): Promise<void> {
  let query = supabase
    .from(HEADER_TABLE)
    .update({ status: 'confirmed' })
    .eq('id', id)
    .eq('status', 'draft');

  if (expectedUpdatedAt) {
    query = query.eq('updated_at', expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();
  assertSingleMutation(data, error, {
    entityName: 'Phiếu nhập sợi',
    expectedStatus: 'draft',
    expectedUpdatedAt,
    transitionName: 'xác nhận phiếu nhập sợi',
  });
}

export async function fetchLatestYarnPrices(
  catalogIds: string[],
): Promise<Record<string, number>> {
  if (!catalogIds || catalogIds.length === 0) return {};

  // Join with yarn_receipts to sort by real receipt_date, not UUID id
  // Only consider confirmed receipts (not draft/cancelled)
  const { data, error } = await supabase
    .from('yarn_receipt_items')
    .select(
      'yarn_catalog_id, landed_price, yarn_receipts!inner(receipt_date, created_at, status)',
    )
    .in('yarn_catalog_id', catalogIds)
    .eq('yarn_receipts.status', 'confirmed')
    .order('receipt_date', {
      ascending: false,
      referencedTable: 'yarn_receipts',
    })
    .order('created_at', {
      ascending: false,
      referencedTable: 'yarn_receipts',
    });

  if (error) throw error;

  // First occurrence per yarn_catalog_id = most recent receipt date
  const priceMap: Record<string, number> = {};
  for (const item of data || []) {
    if (item.yarn_catalog_id && !priceMap[item.yarn_catalog_id]) {
      priceMap[item.yarn_catalog_id] = item.landed_price;
    }
  }
  return priceMap;
}

export interface YarnSlipScanResponse {
  job_id: string;
  status: string;
  extraction: {
    document: {
      document_type: string;
      supplier_raw_name: { value: string | null; confidence: number };
      document_number: { value: string | null; confidence: number };
      document_date: { value: string | null; confidence: number };
      vehicle_plate: { value: string | null; confidence: number };
      customer_name: { value: string | null; confidence: number };
      notes: { value: string | null; confidence: number };
    };
    summary: {
      yarn_type: { value: string | null; confidence: number };
      yarn_lot: { value: string | null; confidence: number };
      package_count: { value: number | null; confidence: number };
      cone_count: { value: number | null; confidence: number };
      gross_weight_kg: { value: number | null; confidence: number };
      tare_weight_kg: { value: number | null; confidence: number };
      declared_net_weight_kg: { value: number | null; confidence: number };
      calculated_net_weight_kg?: number | null;
    };
    packages: Array<{
      package_index: number;
      package_code?: string | null;
      item_type: string;
      cone_count?: number | null;
      gross_kg?: number | null;
      tare_kg?: number | null;
      net_kg: number;
      confidence: number;
      is_outlier: boolean;
      notes?: string | null;
    }>;
    math_discrepancies: Array<{
      level: string;
      rule_name: string;
      severity: 'ERROR' | 'WARNING';
      expected: number;
      actual: number;
      diff: number;
      tolerance: number;
      message_vi: string;
    }>;
    needs_manual_review: boolean;
    review_reasons: string[];
  };
  supplier_match: {
    rawName: string;
    matchedSupplierId: string | null;
    matchedSupplierName: string | null;
    matchedSupplierCode: string | null;
    confidence: number;
    ambiguous: boolean;
    candidates: Array<{
      id: string;
      code: string;
      name: string;
      score: number;
    }>;
  };
  duplicate_guard: {
    isDuplicate: boolean;
    imageHash: string;
    duplicateType?: string;
    existingReceiptId?: string;
    warningMessage?: string;
  };
  suggested_receipt: {
    supplier_id: string | null;
    supplier_name: string | null;
    receipt_number: string | null;
    receipt_date: string | null;
    vehicle_info: string | null;
    notes: string | null;
    yarn_type: string | null;
    yarn_lot: string | null;
    gross_weight_kg: number | null;
    tare_weight_kg: number | null;
    declared_net_weight_kg: number | null;
    package_count: number | null;
    cone_count: number | null;
  };
  validation: {
    passed: boolean;
    needs_manual_review: boolean;
    reasons: string[];
  };
}

/**
 * Uploads yarn slip image to Hono BFF endpoint for OCR extraction,
 * math integrity audit, supplier matching, and duplicate verification.
 */
export async function scanYarnSlip(
  file: File,
  correlationId?: string,
): Promise<YarnSlipScanResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (correlationId) {
    headers['X-Correlation-ID'] = correlationId;
  }

  const endpoint = '/api/v1/yarn-receipts/scan';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorData: {
      error?: string;
      message?: string;
      details?: Record<string, unknown>;
    } = {};
    try {
      errorData = (await response.json()) as {
        error?: string;
        message?: string;
        details?: Record<string, unknown>;
      };
    } catch {
      errorData = { message: await response.text() };
    }
    const message =
      errorData.message || FORM_MESSAGES.scanHttpError(response.status);
    throw new Error(message);
  }

  return (await response.json()) as YarnSlipScanResponse;
}
