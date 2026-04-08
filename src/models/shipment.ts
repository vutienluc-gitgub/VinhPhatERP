import type {
  TableRow,
  TableInsert,
  TableUpdate,
  ShipmentStatus,
} from './common';

export type ShipmentItem = TableRow<'shipment_items'>;
export type ShipmentItemInsert = TableInsert<'shipment_items'>;

export type Shipment = TableRow<'shipments'> & {
  orders?: { order_number: string } | null;
  customers?: { name: string; code: string } | null;
  shipment_items?: ShipmentItem[];
};

export type ShipmentInsert = TableInsert<'shipments'>;
export type ShipmentUpdate = TableUpdate<'shipments'>;

export type ShipmentsFilter = {
  search?: string;
  status?: ShipmentStatus;
  orderId?: string;
};
