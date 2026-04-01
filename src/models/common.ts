export type {
  UserRole,
  ActiveStatus,
  DocStatus,
  OrderStatus,
  ProductionStage,
  StageStatus,
  RollStatus,
  ShipmentStatus,
  PaymentMethod,
  AdjustmentType,
  SupplierCategory,
  CustomerSource,
  InventoryItemType,
} from '@/services/supabase/database.types'

import type { Database } from '@/services/supabase/database.types'

/** Helper: lấy Row type từ tên bảng */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/** Helper: lấy Insert type từ tên bảng */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/** Helper: lấy Update type từ tên bảng */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
