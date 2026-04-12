import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';
import type { DocStatus } from '@/schema/yarn-receipt.schema';

export type { DocStatus };

export type YarnReceiptItem = TableRow<'yarn_receipt_items'>;
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
