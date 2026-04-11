import type { Database } from '@/services/supabase/database.types';

export type OrderStatus = Database['public']['Enums']['order_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type ShipmentStatus = Database['public']['Enums']['shipment_status'];
export type ProductionStage = Database['public']['Enums']['production_stage'];
export type StageStatus = Database['public']['Enums']['stage_status'];

export interface PortalOrderItem {
  id: string;
  fabric_name: string;
  color: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface PortalOrder {
  id: string;
  order_number: string;
  order_date: string;
  due_date: string | null;
  total_amount: number;
  paid_amount: number;
  status: OrderStatus;
  customer_id: string;
  items?: PortalOrderItem[];
}

export interface PortalProgressStage {
  id: string;
  stage: ProductionStage;
  status: StageStatus;
  planned_date: string | null;
  actual_date: string | null;
  is_overdue: boolean;
}

export interface PortalDebtSummary {
  total_amount: number;
  paid_amount: number;
  remaining_debt: number;
  overdue_orders: PortalOrder[];
}

export interface PortalPayment {
  id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  order_number: string | null;
}

export interface PortalShipmentItem {
  roll_number: string;
  fabric_type: string;
  weight_kg: number | null;
  length_m: number | null;
}

export interface PortalShipment {
  id: string;
  shipment_number: string;
  shipment_date: string | null;
  order_number: string | null;
  status: ShipmentStatus;
  delivery_address: string | null;
  customer_id: string;
  items?: PortalShipmentItem[];
}
