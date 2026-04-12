import type {
  OrderStatus,
  ProductionStage,
  StageStatus,
  PortalShipment,
} from '@/features/customer-portal/types';

export type { OrderStatus, ProductionStage, StageStatus };

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  type: 'order_status' | 'order_progress' | 'shipment';
  title: string;
  body: string;
  orderId?: string;
  shipmentId?: string;
  createdAt: string; // ISO 8601
  isRead: boolean;
}

// ---------------------------------------------------------------------------
// PortalDataEvent — dispatched to active hooks for UI auto-update
// ---------------------------------------------------------------------------

export type PortalDataEvent =
  | { type: 'order_status_changed'; orderId: string; newStatus: OrderStatus }
  | {
      type: 'progress_stage_updated';
      stageId: string;
      orderId: string;
      newStatus: StageStatus;
    }
  | { type: 'shipment_created'; shipment: PortalShipment };

// ---------------------------------------------------------------------------
// Supabase Realtime payload shape
// ---------------------------------------------------------------------------

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  table: string;
  schema: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_id: string;
  delivery_date: string | null;
  total_amount: number;
  paid_amount: number;
  order_date: string;
}

export interface OrderProgressRow {
  id: string;
  order_id: string;
  stage: ProductionStage;
  status: StageStatus;
  planned_date: string | null;
  actual_date: string | null;
}

export interface ShipmentRow {
  id: string;
  shipment_number: string;
  order_id: string | null;
  customer_id: string;
  status: string;
  delivery_address: string | null;
  shipment_date: string;
}
