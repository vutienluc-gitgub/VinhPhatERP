import type { DomainEvent } from '@/domain/core/DomainEventBus';

// ─── Orders Events ────────────────────────────────────────────────────────────

export interface OrderConfirmedEvent extends DomainEvent {
  eventName: 'OrderConfirmedEvent';
  payload: {
    orderId: string;
    orderNumber: string;
    customerId: string;
  };
}

export interface OrderCompletedEvent extends DomainEvent {
  eventName: 'OrderCompletedEvent';
  payload: {
    orderId: string;
  };
}

// ─── Inventory Events ─────────────────────────────────────────────────────────

export interface FabricReservedEvent extends DomainEvent {
  eventName: 'FabricReservedEvent';
  payload: {
    orderId: string;
    rollIds: string[];
  };
}

export interface FabricReceivedEvent extends DomainEvent {
  eventName: 'FabricReceivedEvent';
  payload: {
    receiptId: string;
    rollsCount: number;
    totalWeight: number;
  };
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
  | FabricReservedEvent
  | FabricReceivedEvent
  | PaymentCreatedEvent
  | PaymentDeletedEvent
  | ExpenseCreatedEvent
  | ExpenseUpdatedEvent
  | ExpenseDeletedEvent
  | ReceivableCreatedEvent
  | ReceivableUpdatedEvent
  | ReceivableDeletedEvent;
