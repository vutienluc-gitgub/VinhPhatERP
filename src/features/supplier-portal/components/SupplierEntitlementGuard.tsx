import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useSupplierEntitlements } from '@/features/supplier-portal/context/useSupplierEntitlements';
import type { PortalEntitlement } from '@/features/supplier-portal/types/entitlements';
import { Icon } from '@/shared/components';

interface SupplierEntitlementGuardProps {
  requiredEntitlement: PortalEntitlement;
  children: ReactNode;
}

export function SupplierEntitlementGuard({
  requiredEntitlement,
  children,
}: SupplierEntitlementGuardProps) {
  const { hasEntitlement, isLoading } = useSupplierEntitlements();

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Icon
          name="loader-2"
          className="h-8 w-8 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  if (!hasEntitlement(requiredEntitlement)) {
    return <Navigate to="/portal/supplier" replace />;
  }

  return <>{children}</>;
}
