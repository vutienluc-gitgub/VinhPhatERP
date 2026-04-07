import { createContext, useContext, useMemo, type ReactNode } from 'react'

export interface TenantInfo {
  /** Subdomain slug: 'hoaluc', 'vinhphat', etc. */
  slug: string
  /** Full hostname: 'hoaluc.vinhphat.com' */
  hostname: string
  /** Whether this is the default/main tenant (no subdomain) */
  isDefault: boolean
}

const TenantContext = createContext<TenantInfo | null>(null)

/**
 * Resolve tenant from current window.location.hostname.
 *
 * Strategy: Subdomain-based
 *   - hoaluc.vinhphat.com → slug = 'hoaluc'
 *   - vinhphat.com → slug = 'default' (main tenant)
 *   - localhost:5173 → slug = 'default' (dev mode)
 *
 * In dev mode, you can override tenant with ?tenant=hoaluc query param.
 */
export function resolveTenant(): TenantInfo {
  const hostname = window.location.hostname

  // Dev mode: support ?tenant= query param for testing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search)
    const devTenant = params.get('tenant')
    return {
      slug: devTenant || 'default',
      hostname,
      isDefault: !devTenant,
    }
  }

  // Production: extract subdomain
  // Assumes format: {tenant}.{domain}.{tld}
  // Example: hoaluc.vinhphat.com → parts = ['hoaluc', 'vinhphat', 'com']
  const parts = hostname.split('.')

  if (parts.length >= 3) {
    // Has subdomain — guaranteed to exist since length >= 3
    const slug = parts[0] as string
    // Skip 'www' as it's not a tenant
    if (slug === 'www') {
      return { slug: 'default', hostname, isDefault: true }
    }
    return { slug, hostname, isDefault: false }
  }

  // No subdomain (e.g., vinhphat.com)
  return { slug: 'default', hostname, isDefault: true }
}

interface TenantProviderProps {
  children: ReactNode
}

export function TenantProvider({ children }: TenantProviderProps) {
  const tenant = useMemo(() => resolveTenant(), [])

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  )
}

/**
 * Hook to access current tenant information.
 *
 * Usage:
 *   const { slug, isDefault } = useTenant()
 *   // Use slug to filter data or customize branding
 */
export function useTenant(): TenantInfo {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}
