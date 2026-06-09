import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  CustomersFilter,
  PortalAccount,
} from '@/domain/crm/customers.types';
import { supabase } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { customerResponseSchema } from '@/schema/customer.schema';
import { safeUpsert } from '@/lib/db-guard';
import { validateApiInput } from '@/lib/validate-api-input';
import { apiCustomerInsert } from '@/schema/api-validation.schema';

const TABLE = 'customers';

export async function fetchCustomers(
  filters: CustomersFilter = {},
): Promise<Customer[]> {
  let query = supabase
    .from(TABLE)
    .select('*, salesperson:employees!salesperson_id(id, code, name)')
    .order('name', { ascending: true });

  let salespersonId = filters.salesperson_id;

  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, employee_id')
      .eq('id', userData.user.id)
      .single();
    if (profile?.role === 'sale') {
      salespersonId = profile.employee_id || undefined;
    }
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim();
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  if (salespersonId) {
    query = query.eq('salesperson_id', salespersonId);
  }
  if (filters.created_from) {
    query = query.gte('created_at', filters.created_from);
  }
  if (filters.created_to) {
    query = query.lte('created_at', filters.created_to);
  }

  const { data, error } = await query;
  if (error) throw error;
  return customerResponseSchema.array().parse(data ?? []) as Customer[];
}

export async function fetchCustomerById(id: string): Promise<Customer> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, salesperson:employees!salesperson_id(id, code, name)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return customerResponseSchema.parse(data) as Customer;
}

export async function createCustomer(row: CustomerInsert): Promise<Customer> {
  validateApiInput(apiCustomerInsert.passthrough(), row);
  const tenantId = await getTenantId();

  const sanitizedRow = {
    ...row,
    email: row.email?.trim() || null,
    phone: row.phone?.trim() || null,
    tax_code: row.tax_code?.trim() || null,
  };

  // 1. Kiểm tra tồn tại trước khi insert (Database Safety)
  if (sanitizedRow.code || sanitizedRow.email || sanitizedRow.phone) {
    const promises = [];
    if (sanitizedRow.code) {
      promises.push(
        supabase
          .from(TABLE)
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('code', sanitizedRow.code),
      );
    }
    if (sanitizedRow.email) {
      promises.push(
        supabase
          .from(TABLE)
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('email', sanitizedRow.email),
      );
    }
    if (sanitizedRow.phone) {
      promises.push(
        supabase
          .from(TABLE)
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('phone', sanitizedRow.phone),
      );
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      const hasDuplicate = results.some(
        (res) => !res.error && res.data && res.data.length > 0,
      );

      if (hasDuplicate) {
        throw new Error(
          'Khách hàng đã tồn tại (trùng Mã, Email hoặc SDT). Vui lòng kiểm tra lại.',
        );
      }
    }
  }

  // 2. Insert an toàn (sau khi đã check unique constraint)
  try {
    const inserted = await safeUpsert({
      table: TABLE,
      data: {
        ...sanitizedRow,
        id: crypto.randomUUID(),
        tenant_id: tenantId,
      },
      conflictKey: 'id',
    });

    if (Array.isArray(inserted) && inserted.length > 0) {
      return inserted[0] as unknown as Customer;
    }
    return inserted as unknown as Customer;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      throw new Error(
        'Khách hàng bị trùng lặp dữ liệu (Unique Constraint) trong hệ thống.',
      );
    }
    throw error;
  }
}

export async function updateCustomer(
  id: string,
  row: CustomerUpdate,
  expectedUpdatedAt?: string,
): Promise<Customer> {
  const sanitizedRow = {
    ...row,
    email: row.email?.trim() || null,
    phone: row.phone?.trim() || null,
    tax_code: row.tax_code?.trim() || null,
  };

  let query = supabase.from(TABLE).update(sanitizedRow).eq('id', id);

  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, employee_id')
      .eq('id', userData.user.id)
      .single();
    if (profile?.role === 'sale' && profile.employee_id) {
      query = query.eq('salesperson_id', profile.employee_id);
    }
  }

  if (expectedUpdatedAt) {
    query = query.eq('updated_at', expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();

  if (error) {
    if (error.code === 'PGRST116' && expectedUpdatedAt) {
      throw new Error(
        'Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.',
      );
    }
    if (error.code === '23505') {
      throw new Error(
        'Cập nhật thất bại: Mã, Email hoặc SDT đã được sử dụng bởi khách hàng khác.',
      );
    }
    throw error;
  }
  return data as Customer;
}

export async function bulkUpdateCustomers(
  ids: string[],
  row: CustomerUpdate,
): Promise<void> {
  if (!ids.length) return;

  let query = supabase.from(TABLE).update(row).in('id', ids);

  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, employee_id')
      .eq('id', userData.user.id)
      .single();
    if (profile?.role === 'sale' && profile.employee_id) {
      query = query.eq('salesperson_id', profile.employee_id);
    }
  }

  const { error } = await query;
  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  let query = supabase.from(TABLE).delete().eq('id', id);

  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, employee_id')
      .eq('id', userData.user.id)
      .single();
    if (profile?.role === 'sale' && profile.employee_id) {
      query = query.eq('salesperson_id', profile.employee_id);
    }
  }

  const { error } = await query;
  if (error) throw error;
}

export async function fetchNextCustomerCode(): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('code')
    .ilike('code', 'KH-%')
    .order('code', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) return 'KH-001';

  const first = data[0];
  if (!first) return 'KH-001';
  const lastCode = first.code;
  const match = lastCode.match(/^KH-(\d+)$/);
  if (!match?.[1]) return 'KH-001';

  const nextNum = parseInt(match[1], 10) + 1;
  return `KH-${String(nextNum).padStart(3, '0')}`;
}

export async function fetchCustomerPortalAccount(
  customerId: string,
): Promise<PortalAccount | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('customer_id', customerId)
    .eq('role', 'customer')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    email: '(đã có tài khoản)', // Email from auth is not natively queried here
    is_active: data.is_active,
  };
}

export async function createCustomerPortalAccount(payload: {
  customer_id: string;
  full_name: string;
  email: string;
  password?: string;
}): Promise<void> {
  // Refresh session to ensure we have a valid token
  const { data: refreshData, error: refreshError } =
    await supabase.auth.refreshSession();

  const session = refreshData?.session;
  if (refreshError || !session) {
    // Fallback to getSession
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      throw new Error(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      );
    }
    // Use fallback session
    return callEdgeFunction(sessionData.session.access_token, payload);
  }

  return callEdgeFunction(session.access_token, payload);
}

async function callEdgeFunction(
  accessToken: string,
  payload: {
    customer_id: string;
    full_name: string;
    email: string;
    password?: string;
  },
): Promise<void> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-account`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    },
  );

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(
      `Đã có lỗi xảy ra (HTTP ${res.status}). Hãy kiểm tra lại kết nối mạng.`,
    );
  }

  if (!res.ok || !json.ok) {
    throw new Error(
      json.error?.message ?? `Tạo tài khoản thất bại (HTTP ${res.status}).`,
    );
  }
}

export async function updateCustomerPortalAccountStatus(
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;
}
