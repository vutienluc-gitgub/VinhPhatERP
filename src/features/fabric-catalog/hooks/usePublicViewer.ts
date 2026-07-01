import { useMemo } from 'react';

import { useAuth } from '@/shared/hooks/useAuth';
import type { UserRole } from '@/shared/types/database.models';

/**
 * Permissions resolved from the viewer's role.
 * Mirrors the `permissions` block returned by rpc_get_public_fabric_basic
 * but computed client-side for immediate UI decisions (e.g. showing login CTA).
 */
export interface PublicViewerPermissions {
  canViewWholesale: boolean;
  canViewInventory: boolean;
  canOrder: boolean;
  canRFQ: boolean;
  canOpenERP: boolean;
}

export interface PublicViewer {
  isAuthenticated: boolean;
  loading: boolean;
  role: UserRole | null;
  customerId: string | null;
  customerName: string | null;
  isCustomer: boolean;
  isEmployee: boolean;
  permissions: PublicViewerPermissions;
  signOut: () => Promise<void>;
}

const EMPLOYEE_ROLES: UserRole[] = ['admin', 'manager', 'staff', 'sale'];
const WHOLESALE_ROLES: UserRole[] = [...EMPLOYEE_ROLES, 'customer'];

/**
 * Policy Engine for the Public Fabric Catalog.
 *
 * Wraps `useAuth()` and exposes a stable Viewer Context consumed by
 * pricing, inventory, CTA, and portal-link components.
 *
 * NOTE: The authoritative permissions live server-side inside
 * `rpc_get_public_fabric_basic → permissions`.  This hook provides
 * a client-side mirror for *immediate* UI decisions (e.g. whether to
 * render a "Login" button vs. "Go to Portal" button) before the RPC
 * response arrives.
 */
export function usePublicViewer(): PublicViewer {
  const { session, profile, loading, signOut } = useAuth();

  return useMemo(() => {
    const isAuthenticated = !!session;
    const role = (profile?.role ?? null) as UserRole | null;
    const customerId = profile?.customer_id ?? null;
    const customerName = profile?.full_name ?? null;

    const isCustomer = role === 'customer';
    const isEmployee = EMPLOYEE_ROLES.includes(role as UserRole);

    const permissions: PublicViewerPermissions = {
      canViewWholesale: WHOLESALE_ROLES.includes(role as UserRole),
      canViewInventory: WHOLESALE_ROLES.includes(role as UserRole),
      canOrder: isCustomer,
      canRFQ: true, // anonymous can still submit RFQ
      canOpenERP: isEmployee,
    };

    return {
      isAuthenticated,
      loading,
      role,
      customerId,
      customerName,
      isCustomer,
      isEmployee,
      permissions,
      signOut,
    };
  }, [session, profile, loading, signOut]);
}
