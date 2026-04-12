import { useState, useCallback } from 'react';

import { supabase } from '@/services/supabase/client';
import { untypedDb } from '@/services/supabase/untyped';
import type { TenantRegisterFormValues } from '@/schema/tenant-register.schema';

interface RegisterResult {
  success: boolean;
  tenantSlug?: string;
  error?: string;
}

/**
 * Hook xu ly logic dang ky workspace moi.
 *
 * Flow:
 *   1. Kiem tra slug available
 *   2. Tao user (Supabase Auth)
 *   3. Goi RPC create_tenant (tao tenant + subscription + tenant_users)
 *   4. Redirect den [slug].vinhphat.app
 */
export function useRegisterTenant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSlugAvailable = useCallback(
    async (slug: string): Promise<boolean> => {
      const { data } = (await untypedDb.rpc('check_slug_available', {
        p_slug: slug,
      })) as { data: boolean | null };
      return data === true;
    },
    [],
  );

  const register = useCallback(
    async (values: TenantRegisterFormValues): Promise<RegisterResult> => {
      setLoading(true);
      setError(null);

      try {
        const slugOk = await checkSlugAvailable(values.slug);
        if (!slugOk) {
          setError(
            `Subdomain "${values.slug}" da duoc su dung. Vui long chon ten khac.`,
          );
          return {
            success: false,
            error: 'SLUG_TAKEN',
          };
        }

        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: values.email,
            password: values.password,
            options: {
              data: {
                full_name: values.companyName,
                phone: values.phone ?? '',
              },
            },
          },
        );

        if (authError) {
          const msg = vietnameseAuthError(authError.message);
          setError(msg);
          return {
            success: false,
            error: msg,
          };
        }

        const userId = authData.user?.id;
        if (!userId) {
          setError('Khong the tao tai khoan. Vui long thu lai.');
          return {
            success: false,
            error: 'NO_USER_ID',
          };
        }

        const { error: rpcError } = (await untypedDb.rpc('create_tenant', {
          p_name: values.companyName.trim(),
          p_slug: values.slug.trim(),
          p_owner_id: userId,
        })) as { data: unknown; error: { message: string } | null };

        if (rpcError) {
          setError(rpcError.message);
          return {
            success: false,
            error: rpcError.message,
          };
        }

        return {
          success: true,
          tenantSlug: values.slug,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Loi khong xac dinh';
        setError(msg);
        return {
          success: false,
          error: msg,
        };
      } finally {
        setLoading(false);
      }
    },
    [checkSlugAvailable],
  );

  return {
    register,
    checkSlugAvailable,
    loading,
    error,
  };
}

function vietnameseAuthError(message: string): string {
  if (/user already registered/i.test(message))
    return 'Email nay da duoc dang ky.';
  if (/network/i.test(message)) return 'Loi ket noi mang.';
  if (/weak password/i.test(message)) return 'Mat khau qua yeu.';
  return message;
}
