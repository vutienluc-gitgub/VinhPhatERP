import { z } from 'zod';

// ── Permission Types ──

export interface Permission {
  id: string;
  key: string;
  module: string;
  action: string;
  label: string;
  description: string;
  sort_order: number;
}

export interface RolePermission {
  permission_key: string;
  granted: boolean;
}

export interface RolePermissionUpdate {
  key: string;
  granted: boolean;
}

// ── Module labels cho UI ──

export const PERMISSION_MODULE_LABELS: Record<string, string> = {
  orders: 'Đơn hàng',
  quotations: 'Báo giá',
  production: 'Sản xuất',
  inventory: 'Kho / Tồn kho',
  finance: 'Tài chính',
  shipments: 'Giao hàng',
  system: 'Hệ thống',
};

export const PERMISSION_MODULE_ICONS: Record<string, string> = {
  orders: 'ShoppingCart',
  quotations: 'FileText',
  production: 'Factory',
  inventory: 'Package',
  finance: 'Wallet',
  shipments: 'Truck',
  system: 'Shield',
};

// ── Role labels cho UI ──

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  sale: 'Sale',
  viewer: 'Viewer',
  driver: 'Driver',
};

export const CONFIGURABLE_ROLES = [
  'manager',
  'staff',
  'sale',
  'viewer',
  'driver',
] as const;

// ── Zod schema cho upsert ──

export const rolePermissionUpdateSchema = z.object({
  key: z.string().min(1),
  granted: z.boolean(),
});

export const upsertRolePermissionsSchema = z.object({
  role: z.string().min(1),
  permissions: z.array(rolePermissionUpdateSchema),
});
