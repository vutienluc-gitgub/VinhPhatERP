import { untypedDb } from '@/services/supabase/client';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import type {
  CrmLead,
  LeadFilter,
  CrmActivity,
  LeadStatus,
  ActivityType,
} from '@/domain/crm/crm.types';

const LEADS_TABLE = 'crm_leads';
const ACTIVITIES_TABLE = 'crm_activities';

export async function fetchLeadsPaginated(
  filters: LeadFilter = {},
  page = 1,
): Promise<PaginatedResult<CrmLead>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = untypedDb
    .from(LEADS_TABLE)
    .select(
      `
      *,
      rfq_detail:crm_rfq_details(*, fabric_catalog:fabric_catalogs(code, name), variant:fabric_variants(code, color_name)),
      sample_detail:crm_sample_details(*, fabric_catalog:fabric_catalogs(code, name))
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    query = query.or(
      `customer_name.ilike.%${q}%,phone.ilike.%${q}%,company_name.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as unknown as CrmLead[],
    total: count ?? 0,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / DEFAULT_PAGE_SIZE),
  };
}

export async function fetchLeadById(id: string): Promise<CrmLead> {
  const { data, error } = await untypedDb
    .from(LEADS_TABLE)
    .select(
      `
      *,
      rfq_detail:crm_rfq_details(*, fabric_catalog:fabric_catalogs(code, name), variant:fabric_variants(code, color_name)),
      sample_detail:crm_sample_details(*, fabric_catalog:fabric_catalogs(code, name))
    `,
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as CrmLead;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<void> {
  const { error } = await untypedDb
    .from(LEADS_TABLE)
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function fetchLeadActivities(
  leadId: string,
): Promise<CrmActivity[]> {
  const { data, error } = await untypedDb
    .from(ACTIVITIES_TABLE)
    .select(
      `
      *,
      owner:profiles!owner_id(id, full_name)
    `,
    )
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform owner if it's an array due to PostgREST relations
  return (data ?? []).map((row) => ({
    ...row,
    owner: Array.isArray(row.owner) ? row.owner[0] : row.owner,
  })) as unknown as CrmActivity[];
}

export async function createLeadActivity(payload: {
  leadId: string;
  type: ActivityType;
  description: string;
}): Promise<void> {
  const { getTenantId } = await import('@/services/supabase/tenant');
  const tenantId = await getTenantId();

  const { error } = await untypedDb.from(ACTIVITIES_TABLE).insert({
    lead_id: payload.leadId,
    type: payload.type,
    description: payload.description,
    tenant_id: tenantId,
  });

  if (error) throw error;
}
