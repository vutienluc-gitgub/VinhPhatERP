import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { hasSupabaseEnv } from '@/services/supabase/client';
import { untypedDb } from '@/services/supabase/untyped';
import { setCachedTenantId } from '@/services/supabase/tenant';
import { TenantContext, resolveTenant } from '@/shared/context/tenant-context';
import type {
  TenantContextValue,
  TenantData,
  TenantInfo,
} from '@/shared/context/tenant-context';

/** Shape of tenants row returned from DB (columns may not be in database.types.ts yet) */
interface TenantRow {
  id: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
  max_users: number;
  trial_ends_at: string | null;
  logo_url: string | null;
  primary_color: string | null;
  is_active: boolean;
}

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * Provider component for multi-tenant context.
 * Resolves tenant from subdomain, then fetches full tenant data from DB.
 *
 * Hierarchy:
 *   1. resolveTenant() — sync, from URL
 *   2. fetch tenants table — async, from DB
 *   3. Expose via context to all children
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const tenant = useMemo<TenantInfo>(() => resolveTenant(), []);
  const [data, setData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTenant() {
      try {
        const { data: row, error: dbError } = (await untypedDb
          .from('tenants')
          .select(
            'id, slug, name, plan, status, max_users, trial_ends_at, logo_url, primary_color, is_active',
          )
          .eq('slug', tenant.slug)
          .single()) as { data: TenantRow | null; error: unknown };

        if (cancelled) return;

        if (dbError || !row) {
          setError(`Khong tim thay workspace "${tenant.slug}"`);
          setLoading(false);
          return;
        }

        if (!row.is_active) {
          setError('Workspace nay da bi vo hieu hoa. Vui long lien he ho tro.');
          setLoading(false);
          return;
        }

        const tenantData: TenantData = {
          ...tenant,
          id: row.id,
          name: row.name,
          plan: row.plan as TenantData['plan'],
          status: row.status as TenantData['status'],
          maxUsers: row.max_users,
          trialEndsAt: row.trial_ends_at,
          logoUrl: row.logo_url,
          primaryColor: row.primary_color ?? '#6366f1',
        };

        setData(tenantData);
        setCachedTenantId(row.id);
        setError(null);
      } catch {
        if (!cancelled) {
          setError('Khong the ket noi den he thong. Vui long thu lai.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTenant();

    return () => {
      cancelled = true;
    };
  }, [tenant]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      data,
      loading,
      error,
    }),
    [tenant, data, loading, error],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}
