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
import { safeUpsertOne } from '@/lib/db-guard';

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

  await safeUpsertOne({
    table: ACTIVITIES_TABLE,
    data: {
      lead_id: payload.leadId,
      type: payload.type,
      description: payload.description,
      tenant_id: tenantId,
    },
    conflictKey: 'id',
  });
}

export async function createLead(payload: {
  customer_name: string;
  phone: string;
  email?: string;
  company_name?: string;
  type: 'RFQ' | 'SAMPLE' | 'CONTACT';
  source?: string;
  customer_id?: string;
}): Promise<{ id: string }> {
  const { getTenantId } = await import('@/services/supabase/tenant');
  const tenantId = await getTenantId();

  const data = (await safeUpsertOne({
    table: LEADS_TABLE,
    data: {
      ...payload,
      status: 'NEW',
      score: 0,
      tenant_id: tenantId,
    },
    conflictKey: 'id',
  })) as { id: string };
  return data;
}

export async function convertLead(payload: {
  leadId: string;
  customerId?: string; // If provided, link to this customer. If not, create new customer.
}): Promise<{ customerId: string }> {
  // Ideally this should be an RPC call for atomicity.
  // For now, we simulate transaction in client side if RPC is not available yet.

  const lead = await fetchLeadById(payload.leadId);
  if (!lead) throw new Error('Lead not found');

  let finalCustomerId = payload.customerId;

  if (!finalCustomerId) {
    // Create new customer
    const { getTenantId } = await import('@/services/supabase/tenant');
    const tenantId = await getTenantId();

    const cust = (await safeUpsertOne({
      table: 'customers',
      data: {
        name: lead.customer_name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source || 'other',
        status: 'active',
        tenant_id: tenantId,
        lead_status: 'opportunity',
      },
      conflictKey: 'id',
    })) as { id: string };
    finalCustomerId = cust.id;
  }

  // Update lead
  const { error: leadError } = await untypedDb
    .from(LEADS_TABLE)
    .update({
      customer_id: finalCustomerId,
      status: 'CONVERTED',
      converted_at: new Date().toISOString(),
    })
    .eq('id', payload.leadId);

  if (leadError) throw leadError;

  return { customerId: finalCustomerId! };
}

export async function checkDuplicateContact(params: {
  phone?: string;
  email?: string;
}): Promise<{
  customers: Array<{ id: string; name: string }>;
  leads: Array<{ id: string; customer_name: string }>;
}> {
  const result = {
    customers: [] as Array<{ id: string; name: string }>,
    leads: [] as Array<{ id: string; customer_name: string }>,
  };

  if (!params.phone && !params.email) return result;

  // Search in customers
  let customerQuery = untypedDb.from('customers').select('id, name');
  if (params.phone && params.email) {
    customerQuery = customerQuery.or(
      `phone.eq.${params.phone},email.eq.${params.email}`,
    );
  } else if (params.phone) {
    customerQuery = customerQuery.eq('phone', params.phone);
  } else if (params.email) {
    customerQuery = customerQuery.eq('email', params.email);
  }

  const { data: customers } = await customerQuery;
  if (customers) {
    result.customers = customers;
  }

  // Search in leads
  let leadQuery = untypedDb.from(LEADS_TABLE).select('id, customer_name');
  if (params.phone && params.email) {
    leadQuery = leadQuery.or(
      `phone.eq.${params.phone},email.eq.${params.email}`,
    );
  } else if (params.phone) {
    leadQuery = leadQuery.eq('phone', params.phone);
  } else if (params.email) {
    leadQuery = leadQuery.eq('email', params.email);
  }

  const { data: leads } = await leadQuery;
  if (leads) {
    result.leads = leads;
  }

  return result;
}

export async function fetchLeadsByCustomerId(
  customerId: string,
): Promise<CrmLead[]> {
  const { data, error } = await untypedDb
    .from(LEADS_TABLE)
    .select(
      `
      *,
      rfq_detail:crm_rfq_details(*, fabric_catalog:fabric_catalogs(code, name), variant:fabric_variants(code, color_name)),
      sample_detail:crm_sample_details(*, fabric_catalog:fabric_catalogs(code, name))
    `,
    )
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as CrmLead[];
}
