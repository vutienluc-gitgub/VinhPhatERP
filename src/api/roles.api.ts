import { untypedDb } from '@/services/supabase/untyped';
import { getTenantId } from '@/services/supabase/tenant';
import { safeUpsertOne } from '@/lib/db-guard';

export type CompanyRole = {
  id: string;
  code: string;
  name: string;
  is_system: boolean;
  system_role_ref: string | null;
  tenant_id: string;
  created_at: string;
};

const TABLE = 'company_roles';

export async function fetchCompanyRoles(): Promise<CompanyRole[]> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .select('*')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as CompanyRole[];
}

export async function createCompanyRole(data: {
  code: string;
  name: string;
  system_role_ref?: string;
}): Promise<CompanyRole> {
  const tenantId = await getTenantId();

  // Check duplicate at application layer BEFORE hitting DB constraint
  const { data: existing } = await untypedDb
    .from(TABLE)
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('code', data.code)
    .maybeSingle();

  if (existing) {
    throw new Error(`Mã vai trò "${data.code}" đã tồn tại trong hệ thống`);
  }

  const inserted = await safeUpsertOne({
    table: TABLE,
    data: {
      ...data,
      is_system: false,
      tenant_id: tenantId,
    },
    conflictKey: 'id',
  });

  return inserted as CompanyRole;
}

export async function updateCompanyRole(
  id: string,
  data: { name: string },
): Promise<CompanyRole> {
  const { data: updated, error } = await untypedDb
    .from(TABLE)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated as CompanyRole;
}

export async function deleteCompanyRole(id: string): Promise<void> {
  const { error } = await untypedDb
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('is_system', false);
  if (error) throw error;
}
