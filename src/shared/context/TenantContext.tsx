import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import type { Tenant } from '@/shared/types/database.models';

interface TenantContextType {
  currentTenant: Tenant;
  setTenant: (t: Tenant) => void;
}

const defaultTenant: Tenant = {
  id: 'tenant-vinhphat-001',
  name: 'Công ty Cổ phần Dệt may Vĩnh Phát',
  code: 'VINHPHAT',
  is_active: true,
};

const TenantContext = createContext<TenantContextType>({
  currentTenant: defaultTenant,
  setTenant: () => {},
});

export function TenantProvider({ children }: PropsWithChildren) {
  const [currentTenant, setTenant] = useState<Tenant>(defaultTenant);
  return (
    <TenantContext.Provider value={{ currentTenant, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
