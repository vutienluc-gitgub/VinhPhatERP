import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  CustomersFilter,
  PortalAccount,
} from '@/features/customers/types';
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
    .select('*')
    .order('name', { ascending: true });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim();
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return customerResponseSchema.array().parse(data ?? []) as Customer[];
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
): Promise<Customer> {
  const sanitizedRow = {
    ...row,
    email: row.email?.trim() || null,
    phone: row.phone?.trim() || null,
    tax_code: row.tax_code?.trim() || null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(sanitizedRow)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'Cập nhật thất bại: Mã, Email hoặc SDT đã được sử dụng bởi khách hàng khác.',
      );
    }
    throw error;
  }
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
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
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError || !sessionData?.session) {
    throw new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-account`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('Đã có lỗi xảy ra. Hãy kiểm tra lại kết nối mạng.');
  }

  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message ?? 'Tạo tài khoản thất bại.');
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
