import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';
import type {
  ProductionStage,
  StageStatus,
} from '@/schema/order-progress.schema';

export type { ProductionStage, StageStatus };

export type OrderProgress = Omit<TableRow<'order_progress'>, 'order_id'> & {
  order_id: string | null;
  work_order_id: string | null;
};
export type OrderProgressInsert = TableInsert<'order_progress'>;
export type OrderProgressUpdate = TableUpdate<'order_progress'>;

export type OrderProgressWithOrder = OrderProgress & {
  orders?: {
    order_number: string;
    delivery_date: string | null;
    status?: string;
    customers?: { name: string } | null;
  } | null;
  work_orders?: {
    work_order_number: string;
    status: string;
    end_date?: string | null;
    supplier?: { name: string } | null;
    bom_template?: { name: string } | null;
  } | null;
};

export type ProgressAuditLog = {
  id: string;
  progress_id: string;
  order_id: string | null;
  stage: ProductionStage;
  old_status: StageStatus | null;
  new_status: StageStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
};

export type ProgressAuditLogWithOrder = ProgressAuditLog & {
  orders?: { order_number: string; customers?: { name: string } | null } | null;
};
