import type { Database } from '@/services/supabase/database.types';

export type UserRole = Database['public']['Enums']['user_role'];
export type ActiveStatus = Database['public']['Enums']['active_status'];
export type DocStatus = Database['public']['Enums']['doc_status'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type ProductionStage = Database['public']['Enums']['production_stage'];
export type StageStatus = Database['public']['Enums']['stage_status'];
export type RollStatus = Database['public']['Enums']['roll_status'];
export type ShipmentStatus = Database['public']['Enums']['shipment_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type AdjustmentType = Database['public']['Enums']['adjustment_type'];
export type SupplierCategory = Database['public']['Enums']['supplier_category'];
export type CustomerSource = Database['public']['Enums']['customer_source'];
export type InventoryItemType =
  Database['public']['Enums']['inventory_item_type'];
export type CreditStatus = Database['public']['Enums']['credit_status'];
export type BomStatus = Database['public']['Enums']['bom_status'];

/** Helper: lấy Row type từ tên bảng */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Helper: lấy Insert type từ tên bảng */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Helper: lấy Update type từ tên bảng */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
