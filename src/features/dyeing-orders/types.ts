import type { DyeingOrderStatus } from '@/schema/dyeing-order.schema';

export type DyeingOrder = {
  id: string;
  dyeing_order_number: string;
  supplier_id: string;
  order_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  unit_price_per_kg: number;
  paid_amount: number;
  status: DyeingOrderStatus;
  work_order_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  /** Joined */
  suppliers?: {
    name: string;
    code: string;
  } | null;
  dyeing_order_items?: DyeingOrderItem[];
};

export type DyeingOrderItem = {
  id: string;
  dyeing_order_id: string;
  raw_fabric_roll_id: string;
  weight_kg: number;
  length_m: number | null;
  color_name: string;
  color_code: string | null;
  notes: string | null;
  sort_order: number;

  /** Joined */
  raw_fabric_roll?: {
    roll_number: string;
    fabric_type: string;
  } | null;
};

export type DyeingOrderFilter = {
  search?: string;
  status?: DyeingOrderStatus;
  supplierId?: string;
};
