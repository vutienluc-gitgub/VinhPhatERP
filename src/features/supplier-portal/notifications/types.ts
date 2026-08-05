export interface NotificationItem {
  id: string;
  type: 'purchase_order' | 'rfq' | 'debt';
  title: string;
  body: string;
  referenceId?: string;
  createdAt: string;
  isRead: boolean;
}

export type PortalDataEvent =
  | { type: 'purchase_order_changed'; orderId: string; status: string }
  | { type: 'rfq_changed'; rfqId: string; status: string };

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  table: string;
  schema: string;
}

export interface PurchaseOrderRow {
  id: string;
  po_code: string;
  status: string;
  supplier_id: string;
}

export interface SourcingRfqRow {
  id: string;
  rfq_code: string;
  status: string;
}
