/**
 * Yarn-receipt domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';
import type { DocStatus } from '@/schema/yarn-receipt.schema';

export type { DocStatus };

/**
 * Packaging fields added in migration 20260531000001.
 * Remove this extension after regenerating types with `supabase gen types`.
 */
type PackagingFields = {
  cones_per_box: number | null;
  box_count: number | null;
  box_no: string | null;
};

export type YarnReceiptItem = TableRow<'yarn_receipt_items'> & PackagingFields;
export type YarnReceiptItemInsert = TableInsert<'yarn_receipt_items'>;

export type YarnReceipt = TableRow<'yarn_receipts'> & {
  suppliers?: { name: string; code: string } | null;
  yarn_receipt_items?: YarnReceiptItem[];
};
export type YarnReceiptInsert = TableInsert<'yarn_receipts'>;
export type YarnReceiptUpdate = TableUpdate<'yarn_receipts'>;

export type YarnReceiptsFilter = {
  search?: string;
  status?: DocStatus;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
};
