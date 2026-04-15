import type {
  NotificationItem,
  PortalDataEvent,
  RealtimePayload,
  OrderRow,
  OrderProgressRow,
  ShipmentRow,
  QuotationRow,
} from './types';
import {
  mapOrderStatus,
  mapProductionStage,
  mapStageStatus,
  mapQuotationStatus,
} from './notificationMappers';

function makeId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

// ---------------------------------------------------------------------------
// Order status change
// ---------------------------------------------------------------------------

export function createOrderNotification(
  payload: RealtimePayload<OrderRow>,
): NotificationItem | null {
  const { new: newRow, old } = payload;
  if (!newRow.status || newRow.status === old.status) return null;

  return {
    id: makeId(),
    type: 'order_status',
    title: `Đơn hàng ${newRow.order_number} đã cập nhật`,
    body: `Trạng thái mới: ${mapOrderStatus(newRow.status)}`,
    orderId: newRow.id,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
}

export function createOrderDataEvent(
  payload: RealtimePayload<OrderRow>,
): PortalDataEvent | null {
  const { new: newRow, old } = payload;
  if (!newRow.status || newRow.status === old.status) return null;
  return {
    type: 'order_status_changed',
    orderId: newRow.id,
    newStatus: newRow.status,
  };
}

// ---------------------------------------------------------------------------
// Order progress update
// ---------------------------------------------------------------------------

export function createProgressNotification(
  payload: RealtimePayload<OrderProgressRow>,
  orderNumber: string,
): NotificationItem | null {
  const { new: newRow, old, eventType } = payload;
  // For UPDATE, skip if status unchanged
  if (eventType === 'UPDATE' && newRow.status === old.status) return null;

  return {
    id: makeId(),
    type: 'order_progress',
    title: `Tiến độ đơn ${orderNumber} đã cập nhật`,
    body: `${mapProductionStage(newRow.stage)}: ${mapStageStatus(newRow.status)}`,
    orderId: newRow.order_id,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
}

export function createProgressDataEvent(
  payload: RealtimePayload<OrderProgressRow>,
): PortalDataEvent | null {
  const { new: newRow, old, eventType } = payload;
  if (eventType === 'UPDATE' && newRow.status === old.status) return null;
  return {
    type: 'progress_stage_updated',
    stageId: newRow.id,
    orderId: newRow.order_id,
    newStatus: newRow.status,
  };
}

// ---------------------------------------------------------------------------
// Shipment created
// ---------------------------------------------------------------------------

export function createShipmentNotification(
  payload: RealtimePayload<ShipmentRow>,
): NotificationItem | null {
  const { new: newRow } = payload;
  const body = [
    newRow.order_id ? `Đơn hàng liên quan: ${newRow.order_id}` : null,
    newRow.delivery_address ? `Địa chỉ: ${newRow.delivery_address}` : null,
  ]
    .filter(Boolean)
    .join(' — ');

  return {
    id: makeId(),
    type: 'shipment',
    title: `Phiếu giao hàng mới ${newRow.shipment_number}`,
    body: body || 'Phiếu giao hàng mới được tạo',
    shipmentId: newRow.id,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
}

// ---------------------------------------------------------------------------
// Quotation events
// ---------------------------------------------------------------------------

export function createQuotationNotification(
  payload: RealtimePayload<QuotationRow>,
): NotificationItem | null {
  const { new: newRow, old, eventType } = payload;

  // Only notify when sent or status changed to confirmed/rejected/etc.
  if (eventType === 'UPDATE' && newRow.status === old.status) return null;

  // Don't notify for draft
  if (newRow.status === 'draft') return null;

  let title = `Báo giá ${newRow.quotation_number}`;
  let body = `Trạng thái: ${mapQuotationStatus(newRow.status)}`;

  if (
    eventType === 'INSERT' ||
    (old?.status === 'draft' && newRow.status === 'sent')
  ) {
    title = `Báo giá mới: ${newRow.quotation_number}`;
    body = `Bạn nhận được báo giá mới trị giá ${newRow.total_amount.toLocaleString('vi-VN')}đ`;
  }

  return {
    id: makeId(),
    type: 'quotation',
    title,
    body,
    quotationId: newRow.id,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
}

export function createQuotationDataEvent(
  payload: RealtimePayload<QuotationRow>,
): PortalDataEvent | null {
  const { new: newRow } = payload;
  return {
    type: 'quotation_received',
    quotation: {
      id: newRow.id,
      quotation_number: newRow.quotation_number,
      quotation_date: newRow.quotation_date,
      valid_until: newRow.valid_until,
      total_amount: newRow.total_amount,
      status: newRow.status,
      customer_id: newRow.customer_id,
      items: [], // will be fetched by detail hook
      notes: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Security filter — validate customer_id before processing
// ---------------------------------------------------------------------------

export function processPayload<T extends { customer_id?: string }>(
  payload: RealtimePayload<T>,
  currentCustomerId: string,
): RealtimePayload<T> | null {
  if (
    payload.new.customer_id !== undefined &&
    payload.new.customer_id !== currentCustomerId
  ) {
    return null;
  }
  return payload;
}
