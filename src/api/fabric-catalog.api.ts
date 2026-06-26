import type {
  FabricCatalog,
  FabricCatalogFilter,
  FabricVariant,
  FabricImage,
  FabricPricingTier,
  GarmentConversionRule,
} from '@/domain/settings/fabric-catalog.types';
import { supabase, untypedDb } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { safeUpsertOne } from '@/lib/db-guard';

const TABLE = 'fabric_catalogs';

type FabricCatalogRow = Omit<FabricCatalog, 'id' | 'created_at' | 'updated_at'>;

const CATEGORY_SELECT = '*, fabric_categories(id, code, name, color_hint)';

/** Transform Supabase joined row: rename fabric_categories -> category */
function transformCategoryRow(row: Record<string, unknown>): FabricCatalog {
  const category = row.fabric_categories;
  delete row.fabric_categories;
  return { ...row, category } as unknown as FabricCatalog;
}

export async function fetchFabricCatalogPaginated(
  filters: FabricCatalogFilter = {},
  page = 1,
): Promise<PaginatedResult<FabricCatalog>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = untypedDb
    .from(TABLE)
    .select(CATEGORY_SELECT, {
      count: 'exact',
    })
    .order('name', { ascending: true })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.category_id) query = query.eq('category_id', filters.category_id);
  if (filters.composition?.trim()) {
    query = query.ilike('composition', `%${filters.composition.trim()}%`);
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;

  // Transform fabric_categories -> category
  const transformedData = (data ?? []).map((row: Record<string, unknown>) =>
    transformCategoryRow(row),
  );

  return {
    data: transformedData,
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchFabricCatalogOptions(): Promise<
  Pick<FabricCatalog, 'id' | 'code' | 'name' | 'composition' | 'unit'>[]
> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, code, name, composition, unit')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Pick<
    FabricCatalog,
    'id' | 'code' | 'name' | 'composition' | 'unit'
  >[];
}

export async function fetchNextFabricCatalogCode(): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('code')
    .ilike('code', 'FC-%')
    .order('code', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 'FC-001';
  const last = data[0]?.code ?? 'FC-000';
  const match = last.match(/^FC-(\d+)$/);
  if (!match) return 'FC-001';
  const nextNum = parseInt(match[1]!, 10) + 1;
  return `FC-${String(nextNum).padStart(3, '0')}`;
}

export async function createFabricCatalog(
  row: FabricCatalogRow,
): Promise<FabricCatalog> {
  const tenantId = await getTenantId();
  const inserted = await safeUpsertOne({
    table: TABLE,
    data: {
      ...row,
      tenant_id: tenantId,
    },
    conflictKey: 'id',
  });
  return inserted as unknown as FabricCatalog;
}

export async function updateFabricCatalog(
  id: string,
  row: FabricCatalogRow,
): Promise<FabricCatalog> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FabricCatalog;
}

export async function updateFabricCommercial(
  fabricId: string,
  data: {
    minimum_order_qty_kg?: number | null;
    lead_time_days?: number | null;
    production_capacity_monthly_tons?: number | null;
    yield_factor?: number | null;
    public_stock_display?: 'none' | 'status' | 'quantity' | null;
    trust_has_sample?: boolean | null;
    trust_fast_delivery?: boolean | null;
    trust_tech_support?: boolean | null;
    standard_consumption_kg?: number | null;
  },
): Promise<void> {
  const { error } = await untypedDb
    .from('fabric_commercials')
    .update(data)
    .eq('fabric_catalog_id', fabricId);
  if (error) throw error;
}

export async function updateFabricPricingTiers(
  fabricId: string,
  tiers: Array<{
    min_quantity: number;
    max_quantity?: number | null;
    unit_price: number;
    currency?: string;
    display_label?: string | null;
    is_public_visible?: boolean;
  }>,
): Promise<void> {
  const { error } = await untypedDb.rpc('rpc_update_fabric_pricing_tiers', {
    p_fabric_id: fabricId,
    p_tiers: tiers as unknown as Record<string, unknown>[],
  });
  if (error) throw error;
}

export async function deleteFabricCatalog(id: string): Promise<void> {
  // TODO: After running `supabase db push` for migration 20260512000001,
  // switch to: untypedDb.rpc('rpc_delete_fabric_catalog', { p_fabric_id: id })
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchFabricCatalogByIdOrCode(
  identifier: string,
): Promise<FabricCatalog> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

  let query = untypedDb.from(TABLE).select(CATEGORY_SELECT);

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('code', identifier);
  }

  const { data, error } = await query.single();
  if (error) throw error;

  return transformCategoryRow(data as Record<string, unknown>);
}

export async function fetchFabricCategories(): Promise<
  { id: string; name: string; code: string; color_hint?: string }[]
> {
  const { data, error } = await untypedDb
    .from('fabric_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as {
    id: string;
    name: string;
    code: string;
    color_hint?: string;
  }[];
}

export async function fetchGarmentConversionRules(): Promise<
  GarmentConversionRule[]
> {
  const { data, error } = await untypedDb
    .from('garment_conversion_rules')
    .select('*')
    .eq('is_active', true)
    .order('avg_consumption_kg', { ascending: true });
  if (error) throw error;
  return (data ?? []) as GarmentConversionRule[];
}

export async function fetchPublicFabricBasic(
  slug: string,
  sessionId?: string,
): Promise<Partial<FabricCatalog>> {
  const { data, error } = await untypedDb.rpc('rpc_get_public_fabric_basic', {
    p_slug: slug,
    p_session_id: sessionId || null,
  });
  if (error) throw error;
  if (!data) throw new Error('Không tìm thấy thông tin công khai.');
  return data as Partial<FabricCatalog>;
}

export async function fetchPublicFabricVariants(
  fabricId: string,
): Promise<FabricVariant[]> {
  const { data, error } = await untypedDb.rpc(
    'rpc_get_public_fabric_variants',
    {
      p_fabric_id: fabricId,
    },
  );
  if (error) throw error;
  return (data ?? []) as FabricVariant[];
}

export async function fetchPublicFabricImages(
  fabricId: string,
): Promise<FabricImage[]> {
  const { data, error } = await untypedDb.rpc('rpc_get_public_fabric_images', {
    p_fabric_id: fabricId,
  });
  if (error) throw error;
  return (data ?? []) as FabricImage[];
}

export async function fetchRelatedPublicFabrics(
  fabricId: string,
  limit = 3,
): Promise<Partial<FabricCatalog>[]> {
  const { data, error } = await untypedDb.rpc(
    'rpc_get_related_public_fabrics',
    {
      p_fabric_id: fabricId,
      p_limit: limit,
    },
  );
  if (error) throw error;
  return (data ?? []) as Partial<FabricCatalog>[];
}

export async function fetchAlsoViewedPublicFabrics(
  fabricId: string,
  limit = 3,
): Promise<Partial<FabricCatalog>[]> {
  const { data, error } = await untypedDb.rpc(
    'rpc_get_also_viewed_public_fabrics',
    {
      p_fabric_id: fabricId,
      p_limit: limit,
    },
  );
  if (error) throw error;
  return (data ?? []) as Partial<FabricCatalog>[];
}

export async function createPublicSampleRequest(payload: {
  fabricCatalogId?: string | null;
  contactName: string;
  contactPhone: string;
  contactAddress: string;
  companyName?: string;
  selectedVariants?: Array<{ variant_code: string; color_name: string }>;
  sampleItems?: Array<Record<string, unknown>>;
}): Promise<string> {
  const { data, error } = await untypedDb.rpc(
    'rpc_create_public_sample_request',
    {
      p_fabric_catalog_id: payload.fabricCatalogId || null,
      p_contact_name: payload.contactName,
      p_contact_phone: payload.contactPhone,
      p_contact_address: payload.contactAddress,
      p_company_name: payload.companyName || null,
      p_selected_variants: payload.selectedVariants || [],
      p_sample_items: payload.sampleItems || [],
    },
  );
  if (error) throw error;
  return data as string;
}

export async function fetchPublicPricingTiers(
  fabricId: string,
): Promise<FabricPricingTier[]> {
  const { data, error } = await untypedDb.rpc('rpc_get_fabric_pricing_tiers', {
    p_fabric_id: fabricId,
  });
  if (error) throw error;
  return (data ?? []) as FabricPricingTier[];
}

export async function createPublicRFQRequest(payload: {
  fabricCatalogId?: string | null;
  variantId?: string | null;
  quantity?: number | null;
  unit?: string;
  targetPrice?: number | null;
  targetDeliveryDate?: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail?: string | null;
  companyName?: string | null;
  rfqItems?: Array<Record<string, unknown>>;
}): Promise<string> {
  const { data, error } = await untypedDb.rpc('rpc_create_public_rfq_request', {
    p_fabric_catalog_id: payload.fabricCatalogId || null,
    p_variant_id: payload.variantId || null,
    p_quantity: payload.quantity || null,
    p_unit: payload.unit || 'kg',
    p_target_price: payload.targetPrice || null,
    p_target_delivery_date: payload.targetDeliveryDate || null,
    p_contact_name: payload.contactName,
    p_contact_phone: payload.contactPhone,
    p_contact_email: payload.contactEmail || null,
    p_company_name: payload.companyName || null,
    p_rfq_items: payload.rfqItems || [],
  });
  if (error) throw error;
  return data as string;
}

export async function syncFabricImages(
  fabricId: string,
  images: Partial<FabricImage>[],
): Promise<void> {
  const { error } = await untypedDb.rpc('rpc_sync_fabric_images', {
    p_fabric_id: fabricId,
    p_images: images,
  });
  if (error) throw error;
}
