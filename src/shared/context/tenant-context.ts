import { createContext } from 'react';

export interface TenantInfo {
  /** Subdomain slug: 'hoaluc', 'vinhphat', etc. */
  slug: string;
  /** Full hostname: 'hoaluc.vinhphat.app' */
  hostname: string;
  /** Whether this is the default/main tenant (no subdomain) */
  isDefault: boolean;
}

/** Extended tenant info loaded from database */
export interface TenantData extends TenantInfo {
  /** UUID from tenants table */
  id: string;
  /** Display name */
  name: string;
  /** Subscription plan */
  plan: 'starter' | 'professional' | 'enterprise' | 'trial';
  /** Tenant status */
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  /** Max allowed users */
  maxUsers: number;
  /** Trial end date (null = no trial) */
  trialEndsAt: string | null;
  /** Logo URL for white-label */
  logoUrl: string | null;
  /** Brand color */
  primaryColor: string;
}

export interface TenantContextValue {
  /** Basic tenant info (always available, sync) */
  tenant: TenantInfo;
  /** Full tenant data from DB (null while loading) */
  data: TenantData | null;
  /** True while fetching tenant data */
  loading: boolean;
  /** Error if tenant not found or suspended */
  error: string | null;
}

export const TenantContext = createContext<TenantContextValue | null>(null);

/**
 * Resolve tenant from current window.location.hostname.
 * Supports subdomain routing: [slug].vinhphat.app
 * Dev mode: localhost?tenant=slug
 */
export function resolveTenant(): TenantInfo {
  const hostname = window.location.hostname;

  // Dev mode: support ?tenant= query param for testing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search);
    const devTenant = params.get('tenant');
    return {
      slug: devTenant || 'default',
      hostname,
      isDefault: !devTenant,
    };
  }

  // Production: extract subdomain from [slug].vinhphat.app
  const parts = hostname.split('.');

  if (parts.length >= 3) {
    const slug = parts[0] as string;
    if (slug === 'www' || slug === 'app') {
      return {
        slug: 'default',
        hostname,
        isDefault: true,
      };
    }
    return {
      slug,
      hostname,
      isDefault: false,
    };
  }

  return {
    slug: 'default',
    hostname,
    isDefault: true,
  };
}
