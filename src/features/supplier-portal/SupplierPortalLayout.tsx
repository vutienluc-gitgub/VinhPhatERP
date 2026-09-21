import React, { PropsWithChildren } from 'react';
import { PortalLayout } from '@/features/portal-shared/components/PortalLayout';
export function SupplierPortalLayout({ children }: PropsWithChildren) {
  return <PortalLayout>{children}</PortalLayout>;
}
