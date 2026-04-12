import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';

export type InventoryAdjustment = TableRow<'inventory_adjustments'>;
export type InventoryAdjustmentInsert = TableInsert<'inventory_adjustments'>;
export type InventoryAdjustmentUpdate = TableUpdate<'inventory_adjustments'>;
