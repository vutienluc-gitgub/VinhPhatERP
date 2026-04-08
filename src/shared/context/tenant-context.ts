import { createContext } from 'react';

export interface TenantInfo {
  /** Subdomain slug: 'hoaluc', 'vinhphat', etc. */
  slug: string;
  /** Full hostname: 'hoaluc.vinhphat.com' */
  hostname: string;
  /** Whether this is the default/main tenant (no subdomain) */
  isDefault: boolean;
}

export const TenantContext = createContext<TenantInfo | null>(null);

/**
 * Resolve tenant from current window.location.hostname.
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

  // Production: extract subdomain
  const parts = hostname.split('.');

  if (parts.length >= 3) {
    const slug = parts[0] as string;
    if (slug === 'www') {
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
