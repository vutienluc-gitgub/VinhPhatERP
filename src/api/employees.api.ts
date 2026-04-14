import { supabase } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import type { Employee, EmployeeFormValues } from '@/schema';

const TABLE = 'employees';

export async function fetchEmployees(filters?: {
  role?: string;
  status?: string;
  query?: string;
}): Promise<Employee[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true });

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.query?.trim()) {
    const q = filters.query.trim();
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Employee[];
}

export async function getEmployeeById(id: string): Promise<Employee> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function createEmployee(
  row: EmployeeFormValues & { code: string },
): Promise<Employee> {
  const tenantId = await getTenantId();

  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      {
        ...row,
        tenant_id: tenantId,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function updateEmployee(
  id: string,
  row: Partial<EmployeeFormValues>,
): Promise<Employee> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function deactivateEmployee(id: string): Promise<Employee> {
  return updateEmployee(id, { status: 'inactive' });
}

export async function fetchNextEmployeeCode(): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('code')
    .ilike('code', 'NV%')
    .order('code', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) return 'NV001';

  const first = data[0];
  if (!first) return 'NV001';
  const lastCode = first.code;
  const match = lastCode.match(/^NV(\d+)$/);
  if (!match?.[1]) return 'NV001';

  const nextNum = parseInt(match[1], 10) + 1;
  return `NV${String(nextNum).padStart(3, '0')}`;
}
