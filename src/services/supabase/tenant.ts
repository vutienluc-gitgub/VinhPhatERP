import { supabase } from '@/services/supabase/client';
import { resolveTenant } from '@/shared/context/tenant-context';

/**
 * Tenant-aware Supabase client helper.
 *
 * Cach hoat dong Multi-tenant:
 *
 * 1. SELECT (doc du lieu):
 *    -> RLS policies tu dong loc theo tenant_id cua user (database-level).
 *    -> Khong can them .eq('tenant_id', ...) thu cong.
 *
 * 2. INSERT (tao moi):
 *    -> Phai inject tenant_id vao row truoc khi insert.
 *    -> Dung helper `withTenantId()` de tu dong them.
 *
 * 3. UPDATE/DELETE:
 *    -> RLS policies dam bao chi sua/xoa du lieu cua tenant minh.
 *
 * Usage:
 *   import { withTenantId, getTenantId } from '@/services/supabase/tenant'
 *
 *   // Insert
 *   await supabase.from('orders').insert(withTenantId(orderData))
 *
 *   // Bulk insert
 *   await supabase.from('order_items').insert(items.map(withTenantId))
 */

let cachedTenantId: string | null = null;

/**
 * Get the current tenant's database ID.
 * Fetches once then caches for the session.
 */
export async function getTenantId(): Promise<string> {
  if (cachedTenantId) return cachedTenantId;

  const tenant = resolveTenant();

  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenant.slug)
    .single();

  if (error || !data) {
    console.error(
      '[Tenant] Could not resolve tenant_id for slug:',
      tenant.slug,
      error,
    );
    const { data: fallback } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'default')
      .single();

    if (fallback) {
      cachedTenantId = fallback.id;
      return fallback.id;
    }

    throw new Error(`Tenant "${tenant.slug}" not found in database`);
  }

  cachedTenantId = data.id;
  return data.id;
}

/**
 * Synchronous getter (returns cached value or null).
 * Use this when you're sure tenant has been resolved already.
 */
export function getCachedTenantId(): string | null {
  return cachedTenantId;
}

/**
 * Set tenant ID directly (used by TenantProvider after DB fetch).
 */
export function setCachedTenantId(id: string): void {
  cachedTenantId = id;
}

/**
 * Add tenant_id to a row before inserting.
 * Must call `await getTenantId()` first to populate cache.
 *
 * @example
 *   await getTenantId() // populate cache on app init
 *   await supabase.from('orders').insert(withTenantId({ order_number: 'SO-001' }))
 */
export function withTenantId<T extends Record<string, unknown>>(
  row: T,
): T & { tenant_id: string } {
  const tenantId = cachedTenantId;
  if (!tenantId) {
    throw new Error(
      '[Tenant] tenant_id not resolved yet. Call getTenantId() first.',
    );
  }
  return {
    ...row,
    tenant_id: tenantId,
  };
}

/**
 * Reset cached tenant (for testing or tenant switching).
 */
export function resetTenantCache(): void {
  cachedTenantId = null;
}
