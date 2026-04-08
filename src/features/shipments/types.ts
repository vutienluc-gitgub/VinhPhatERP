import type { ShipmentStatus } from '@/schema/shipment.schema';
export type { ShipmentStatus };

export type ShipmentItem = {
  id: string;
  shipment_id: string;
  finished_roll_id: string | null;
  fabric_type: string;
  color_name: string | null;
  quantity: number;
  unit: string;
  notes: string | null;
  sort_order: number;
};

export type ShipmentCustomerSummary = {
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  contact_person: string | null;
};

export type ShipmentOrderSummary = {
  order_number: string;
};

export type ShipmentDocumentItem = ShipmentItem & {
  roll_number: string | null;
  roll_length_m: number | null;
  warehouse_location: string | null;
};

export type DeliveryStaffSummary = {
  id: string;
  full_name: string;
  phone: string | null;
};

export type Shipment = {
  id: string;
  shipment_number: string;
  order_id: string;
  customer_id: string;
  shipment_date: string;
  delivery_address: string | null;
  carrier: string | null;
  tracking_number: string | null;
  status: ShipmentStatus;
  notes: string | null;
  // Delivery tracking
  delivery_staff_id: string | null;
  shipping_rate_id: string | null;
  shipping_cost: number;
  loading_fee: number;
  total_weight_kg: number | null;
  total_meters: number | null;
  vehicle_info: string | null;
  prepared_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  delivery_proof: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Joined */
  orders?: { order_number: string } | null;
  customers?: { name: string; code: string } | null;
  delivery_staff?: { full_name: string; phone: string | null } | null;
  shipment_items?: ShipmentItem[];
};

export type ShipmentDocument = Omit<
  Shipment,
  'orders' | 'customers' | 'shipment_items'
> & {
  orders?: ShipmentOrderSummary | null;
  customers?: ShipmentCustomerSummary | null;
  shipment_items?: ShipmentDocumentItem[];
};

export type ShipmentsFilter = {
  search?: string;
  status?: ShipmentStatus;
  orderId?: string;
  deliveryStaffId?: string;
};
