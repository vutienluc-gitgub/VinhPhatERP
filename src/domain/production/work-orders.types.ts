/**
 * Work-order domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
import type { WorkOrderStatus } from '@/schema/work-order.schema';
export type { WorkOrderStatus };

export interface WorkOrder {
  id: string;
  work_order_number: string;
  order_id: string | null;
  bom_template_id: string;
  bom_version: number;
  target_quantity: number;
  target_unit: string;
  target_weight_kg: number | null;
  standard_loss_pct: number;
  actual_yield_m: number | null;
  actual_loss_pct: number | null;
  status: WorkOrderStatus;
  start_date: string | null;
  end_date: string | null;
  supplier_id: string;
  weaving_unit_price: number;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderYarnRequirement {
  id: string;
  work_order_id: string;
  yarn_catalog_id: string;
  bom_ratio_pct: number;
  required_kg: number;
  allocated_kg: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderWithRelations extends WorkOrder {
  bom_template?: {
    id: string;
    code: string;
    name: string;
    target_fabric?: {
      id: string;
      code: string;
      name: string;
    };
  };
  order?: {
    id: string;
    order_number: string;
    customer?: {
      id: string;
      name: string;
    };
  };
  supplier?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface WorkOrderYarnRequirementWithRelations extends WorkOrderYarnRequirement {
  yarn_catalog?: {
    id: string;
    code: string;
    name: string;
    color_name: string | null;
  };
}

/** A single yarn issue record: which receipt-item lot was issued to which WO. */
export interface WorkOrderYarnIssue {
  id: string;
  work_order_id: string;
  yarn_receipt_item_id: string;
  issued_kg: number;
  notes: string | null;
  tenant_id: string | null;
  created_by: string | null;
  created_at: string;
}

/** Yarn issue row with joined receipt-item + receipt header info. */
export interface WorkOrderYarnIssueWithRelations extends WorkOrderYarnIssue {
  receipt_number: string;
  receipt_date: string;
  lot_number: string | null;
  yarn_type: string;
  supplier_name: string;
}

/** A row from v_yarn_receipt_item_availability — available lot for issuing. */
export interface AvailableYarnLot {
  yarn_receipt_item_id: string;
  yarn_catalog_id: string | null;
  receipt_id: string;
  receipt_number: string;
  receipt_date: string;
  supplier_id: string;
  supplier_name: string;
  yarn_type: string;
  lot_number: string | null;
  color_name: string | null;
  grade: string | null;
  unit: string;
  received_qty: number;
  issued_qty: number;
  available_qty: number;
  landed_price: number;
  tenant_id: string | null;
}

/** Input item for rpc_issue_yarn_lots */
export interface IssueYarnLotItem {
  yarn_receipt_item_id: string;
  issued_kg: number;
  notes?: string;
}

export type WorkOrderFilter = {
  status?: WorkOrderStatus | 'all';
  search?: string;
  supplier_id?: string;
};
