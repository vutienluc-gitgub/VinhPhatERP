/**
 * Centralized entity type definitions and labels.
 * Single source of truth for all entity-related constants.
 */

export type EntityType =
  | 'customer'
  | 'supplier'
  | 'yarn'
  | 'loom'
  | 'employee'
  | 'order'
  | 'fabric';

/** Route path segments for each entity type (used in URL construction). */
export const ENTITY_ROUTES: Record<EntityType, string> = {
  customer: 'customers',
  supplier: 'suppliers',
  yarn: 'yarn-catalog',
  loom: 'looms',
  employee: 'employees',
  order: 'orders',
  fabric: 'fabric-catalog',
};

/** Vietnamese display labels for each entity type. */
export const ENTITY_LABELS: Record<EntityType, string> = {
  customer: 'khách hàng',
  supplier: 'nhà cung cấp',
  yarn: 'sợi',
  loom: 'máy dệt',
  employee: 'nhân viên',
  order: 'đơn hàng',
  fabric: 'vải',
};
