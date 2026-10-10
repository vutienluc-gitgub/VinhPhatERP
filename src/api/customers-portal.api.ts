import type { PortalAccount } from '@/domain/crm/customers.types';
import { supabase } from '@/services/supabase/client';

export interface CreateCustomerPortalAccountPayload {
  customer_id: string;
  full_name: string;
  email?: string;
  customer_code?: string;
  password?: string;
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

export async function createCustomerPortalAccount(
  payload: CreateCustomerPortalAccountPayload,
): Promise<void> {
  // Refresh session to ensure we have a valid token
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session =
    refreshData?.session ?? (await supabase.auth.getSession()).data.session;

  if (!session) {
    throw new Error(
      'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    );
  }

  return callEdgeFunction(session.access_token, payload);
}

async function callEdgeFunction(
  accessToken: string,
  payload: CreateCustomerPortalAccountPayload,
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
