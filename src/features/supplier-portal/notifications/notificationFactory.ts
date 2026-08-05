import type {
  NotificationItem,
  PortalDataEvent,
  RealtimePayload,
  PurchaseOrderRow,
  SourcingRfqRow,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createId() {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Factory Methods
// ---------------------------------------------------------------------------

export function createPoNotification(po: PurchaseOrderRow): NotificationItem {
  return {
    id: createId(),
    type: 'purchase_order',
    title: 'Đơn hàng mới / Cập nhật',
    body: `Đơn hàng ${po.po_code} đã chuyển sang trạng thái: ${po.status}`,
    referenceId: po.id,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
}

export function createPoDataEvent(po: PurchaseOrderRow): PortalDataEvent {
  return {
    type: 'purchase_order_changed',
    orderId: po.id,
    status: po.status,
  };
}

export function createRfqNotification(rfq: SourcingRfqRow): NotificationItem {
  return {
    id: createId(),
    type: 'rfq',
    title: 'Yêu cầu báo giá mới',
    body: `RFQ ${rfq.rfq_code} đang chờ báo giá của bạn.`,
    referenceId: rfq.id,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
}

export function createRfqDataEvent(rfq: SourcingRfqRow): PortalDataEvent {
  return {
    type: 'rfq_changed',
    rfqId: rfq.id,
    status: rfq.status,
  };
}

// ---------------------------------------------------------------------------
// Main Processor
// ---------------------------------------------------------------------------

export interface ProcessingResult {
  notification: NotificationItem | null;
  event: PortalDataEvent | null;
}

export function processPayload(
  payload: RealtimePayload<unknown>,
): ProcessingResult {
  const result: ProcessingResult = { notification: null, event: null };
  const { table, eventType, new: newRec, old: oldRec } = payload;

  if (table === 'purchase_orders') {
    const po = newRec as PurchaseOrderRow;
    const oldPo = oldRec as Partial<PurchaseOrderRow>;
    if (
      eventType === 'INSERT' ||
      (eventType === 'UPDATE' && po.status !== oldPo.status)
    ) {
      if (['pending', 'approved', 'sent'].includes(po.status)) {
        result.notification = createPoNotification(po);
      }
      result.event = createPoDataEvent(po);
    }
  }

  if (table === 'sourcing_rfqs') {
    const rfq = newRec as SourcingRfqRow;
    const oldRfq = oldRec as Partial<SourcingRfqRow>;
    if (
      eventType === 'INSERT' ||
      (eventType === 'UPDATE' && rfq.status !== oldRfq.status)
    ) {
      if (rfq.status === 'published') {
        result.notification = createRfqNotification(rfq);
      }
      result.event = createRfqDataEvent(rfq);
    }
  }

  return result;
}
