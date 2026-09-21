export type UserRole = 'admin' | 'manager' | 'staff' | 'driver' | 'customer' | 'supplier' | 'worker' | string;

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  tenant_id?: string;
  created_at?: string;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  settings?: Record<string, any>;
}

export interface BaseModel {
  id: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}
