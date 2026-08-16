import type { DomainEvent } from '@/domain/core/DomainEventBus';

// ─── Orders Events ────────────────────────────────────────────────────────────

export interface OrderConfirmedPayload {
  orderId: string;
  orderNumber: string;
  customerId: string;
  totalAmount?: number;
  confirmedAt?: string;
}

export interface OrderConfirmedEvent extends DomainEvent {
  eventName: 'OrderConfirmedEvent';
  payload: OrderConfirmedPayload;
}

export interface OrderCompletedPayload {
  orderId: string;
  orderNumber?: string;
  completedAt?: string;
}

export interface OrderCompletedEvent extends DomainEvent {
  eventName: 'OrderCompletedEvent';
  payload: OrderCompletedPayload;
}

// ─── Shipments & Logistics Events ─────────────────────────────────────────────

export interface ShipmentShippedPayload {
  shipmentId: string;
  shipmentNumber: string;
  orderId?: string | null;
  rollIds: string[];
  shippedAt: string;
  driverId?: string | null;
}

export interface ShipmentShippedEvent extends DomainEvent {
  eventName: 'ShipmentShippedEvent';
  payload: ShipmentShippedPayload;
}

// ─── Inventory Events ─────────────────────────────────────────────────────────

export interface FabricReservedEvent extends DomainEvent {
  eventName: 'FabricReservedEvent';
  payload: {
    orderId: string;
    rollIds: string[];
  };
}

export interface FabricReceivedPayload {
  receiptId: string;
  materialId?: string;
  fabricType?: string;
  color?: string;
  gsm?: number;
  rollsCount: number;
  totalWeight: number;
  warehouseId?: string;
  lotNumber?: string;
  receivedAt?: string;
  receivedBy?: string;
}

export interface FabricReceivedEvent extends DomainEvent {
  eventName: 'FabricReceivedEvent';
  payload: FabricReceivedPayload;
}

// ─── Production & MES Events ──────────────────────────────────────────────────

export interface MaterialAvailablePayload {
  workOrderId: string;
  workOrderNumber: string;
  fabricType?: string;
  color?: string;
  requiredKg: number;
  availableKg: number;
  status: 'ready_to_start' | 'partially_available';
}

export interface MaterialAvailableEvent extends DomainEvent {
  eventName: 'MaterialAvailableEvent';
  payload: MaterialAvailablePayload;
}

// ─── Payments & Expenses Events ─────────────────────────────────────────────────

export interface PaymentCreatedEvent extends DomainEvent {
  eventName: 'PaymentCreatedEvent';
  payload: { paymentId: string; orderId?: string };
}

export interface PaymentDeletedEvent extends DomainEvent {
  eventName: 'PaymentDeletedEvent';
  payload: { paymentId: string };
}

export interface ExpenseCreatedEvent extends DomainEvent {
  eventName: 'ExpenseCreatedEvent';
  payload: { expenseId: string };
}

export interface ExpenseUpdatedEvent extends DomainEvent {
  eventName: 'ExpenseUpdatedEvent';
  payload: { expenseId: string };
}

export interface ExpenseDeletedEvent extends DomainEvent {
  eventName: 'ExpenseDeletedEvent';
  payload: { expenseId: string };
}

// ─── Receivables (Realtime) Events ─────────────────────────────────────────────

export interface ReceivableCreatedEvent extends DomainEvent {
  eventName: 'ReceivableCreatedEvent';
  payload: { entityId: string; customerId: string };
}

export interface ReceivableUpdatedEvent extends DomainEvent {
  eventName: 'ReceivableUpdatedEvent';
  payload: { entityId: string; customerId: string };
}

export interface ReceivableDeletedEvent extends DomainEvent {
  eventName: 'ReceivableDeletedEvent';
  payload: { entityId: string; customerId: string };
}

// ─── Event Type Union ─────────────────────────────────────────────────────────

export type AppDomainEvent =
  | OrderConfirmedEvent
  | OrderCompletedEvent
  | ShipmentShippedEvent
  | FabricReservedEvent
  | FabricReceivedEvent
  | MaterialAvailableEvent
  | PaymentCreatedEvent
  | PaymentDeletedEvent
  | ExpenseCreatedEvent
  | ExpenseUpdatedEvent
  | ExpenseDeletedEvent
  | ReceivableCreatedEvent
  | ReceivableUpdatedEvent
  | ReceivableDeletedEvent;
