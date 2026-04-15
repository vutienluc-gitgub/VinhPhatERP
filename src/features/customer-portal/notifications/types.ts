import type {
  OrderStatus,
  ProductionStage,
  StageStatus,
  PortalShipment,
  PortalQuotation,
  QuotationStatus,
} from '@/features/customer-portal/types';

export type { OrderStatus, ProductionStage, StageStatus, QuotationStatus };

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  type: 'order_status' | 'order_progress' | 'shipment' | 'quotation';
  title: string;
  body: string;
  orderId?: string;
  shipmentId?: string;
  quotationId?: string;
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
  | { type: 'shipment_created'; shipment: PortalShipment }
  | { type: 'quotation_received'; quotation: PortalQuotation };

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

export interface QuotationRow {
  id: string;
  quotation_number: string;
  customer_id: string;
  status: QuotationStatus;
  total_amount: number;
  quotation_date: string;
  valid_until: string | null;
}
