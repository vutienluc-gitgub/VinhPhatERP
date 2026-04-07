import type { WorkOrderStatus } from '@/schema/work-order.schema'
export type { WorkOrderStatus }


export interface WorkOrder {
  id: string;
  work_order_number: string;
  order_id: string | null;
  bom_template_id: string;
  bom_version: number;
  target_quantity_m: number;
  target_unit: string;
  target_weight_kg: number | null;
  standard_loss_pct: number;
  actual_yield_m: number | null;
  actual_loss_pct: number | null;
  status: WorkOrderStatus;
  start_date: string | null;
  end_date: string | null;
  supplier_id: string; // Nhà dệt gia công
  weaving_unit_price: number; // Đơn giá gia công (khoán/m)
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

export type WorkOrderFilter = {
  status?: WorkOrderStatus | 'all';
  search?: string;
};
