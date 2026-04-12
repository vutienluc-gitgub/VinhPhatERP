import type {
  TableRow,
  TableInsert,
  TableUpdate,
} from '@/shared/types/database.models';
import type { ShipmentStatus } from '@/schema/shipment.schema';
export type { ShipmentStatus };

export type ShipmentItem = TableRow<'shipment_items'>;
export type ShipmentItemInsert = TableInsert<'shipment_items'>;

export type Shipment = TableRow<'shipments'> & {
  orders?: { order_number: string } | null;
  customers?: { name: string; code: string } | null;
  shipment_items?: ShipmentItem[];
  delivery_staff?: { full_name: string; phone: string | null } | null;
};
export type ShipmentInsert = TableInsert<'shipments'>;
export type ShipmentUpdate = TableUpdate<'shipments'>;

export type ShipmentsFilter = {
  search?: string;
  status?: ShipmentStatus;
  orderId?: string;
  deliveryStaffId?: string;
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

export type ShipmentDocument = Omit<
  Shipment,
  'orders' | 'customers' | 'shipment_items'
> & {
  orders?: ShipmentOrderSummary | null;
  customers?: ShipmentCustomerSummary | null;
  shipment_items?: ShipmentDocumentItem[];
};
