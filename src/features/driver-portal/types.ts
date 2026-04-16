export type JourneyStatus =
  | 'pending_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'delivered_confirmed';

export const JOURNEY_STATUS_LABELS: Record<JourneyStatus, string> = {
  pending_pickup: 'Chưa lấy hàng',
  picked_up: 'Đã lấy hàng',
  in_transit: 'Đang trên đường',
  arrived: 'Đã đến nơi',
  delivered_confirmed: 'Đã giao - xác nhận',
};

export const JOURNEY_STATUS_ORDER: JourneyStatus[] = [
  'pending_pickup',
  'picked_up',
  'in_transit',
  'arrived',
  'delivered_confirmed',
];

export type JourneyLog = {
  id: string;
  shipment_id: string;
  journey_status: JourneyStatus;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
};

export type DriverShipment = {
  id: string;
  shipment_number: string;
  shipment_date: string;
  status: string;
  journey_status: JourneyStatus | null;
  delivery_address: string | null;
  vehicle_info: string | null;
  shipping_cost: number | null;
  loading_fee: number | null;
  customers?: { name: string; address: string | null } | null;
  orders?: { order_number: string } | null;
};
