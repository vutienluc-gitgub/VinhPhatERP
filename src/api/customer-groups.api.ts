import { untypedDb } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { safeUpsert } from '@/lib/db-guard';
import type {
  CustomerGroup,
  CustomerGroupInsert,
  CustomerGroupUpdate,
} from '@/domain/crm/customer-groups.types';

export async function fetchCustomerGroups(): Promise<CustomerGroup[]> {
  const { data, error } = await untypedDb
    .from('customer_groups')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[customer-groups.api] fetch error:', error);
    throw error;
  }
  return (data || []) as CustomerGroup[];
}

export async function createCustomerGroup(
  group: CustomerGroupInsert,
): Promise<CustomerGroup> {
  const tenantId = await getTenantId();
  const payload = {
    ...group,
    tenant_id: tenantId,
  };

  const result = await safeUpsert({
    table: 'customer_groups',
    data: payload,
    conflictKey: 'code',
  });

  return (Array.isArray(result) && result.length > 0
    ? result[0]
    : result) as unknown as CustomerGroup;
}

export async function updateCustomerGroup(
  id: string,
  group: CustomerGroupUpdate,
): Promise<CustomerGroup> {
  const { data, error } = await untypedDb
    .from('customer_groups')
    .update(group)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[customer-groups.api] update error:', error);
    throw error;
  }

  return data as CustomerGroup;
}

export async function deleteCustomerGroup(id: string): Promise<void> {
  const { error } = await untypedDb
    .from('customer_groups')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[customer-groups.api] delete error:', error);
    throw error;
  }
}

export async function fetchCustomerGroupsForCustomer(
  customerId: string,
): Promise<string[]> {
  const { data, error } = await untypedDb
    .from('customer_group_members')
    .select('group_id')
    .eq('customer_id', customerId);

  if (error) {
    console.error('[customer-groups.api] fetch customer groups error:', error);
    throw error;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => row.group_id as string);
}

export async function saveCustomerGroupsForCustomer(
  customerId: string,
  groupIds: string[],
): Promise<void> {
  // Xóa liên kết nhóm cũ
  const { error: deleteError } = await untypedDb
    .from('customer_group_members')
    .delete()
    .eq('customer_id', customerId);

  if (deleteError) {
    console.error('[customer-groups.api] delete members error:', deleteError);
    throw deleteError;
  }

  // Chèn liên kết nhóm mới
  if (groupIds.length > 0) {
    const payload = groupIds.map((groupId) => ({
      customer_id: customerId,
      group_id: groupId,
    }));

    const { error: insertError } = await untypedDb
      .from('customer_group_members')
      .insert(payload);

    if (insertError) {
      console.error('[customer-groups.api] insert members error:', insertError);
      throw insertError;
    }
  }
}
