/**
 * Logistics Event Envelope Domain Types (Pure TypeScript - Domain Layer)
 * Standardized 10-field Domain Event for Transactional Outbox & EDA Dispatcher.
 */

export type LogisticsAggregateType =
  | 'shipment'
  | 'delivery_stop'
  | 'delivery_attempt'
  | 'epod';

export type LogisticsEventType =
  | 'DELIVERY.ATTEMPT_ASSIGNED'
  | 'DELIVERY.PICKUP_CONFIRMED'
  | 'DELIVERY.TRANSIT_STARTED'
  | 'DELIVERY.DRIVER_ARRIVED'
  | 'DELIVERY.EPOD_SUBMITTED'
  | 'DELIVERY.EXCEPTION_OCCURRED'
  | 'DELIVERY.ATTEMPT_COMPLETED'
  | 'DELIVERY.ATTEMPT_CANCELLED';

export interface DomainEventEnvelope<T = Record<string, unknown>> {
  eventId: string;
  eventType: LogisticsEventType;
  aggregateType: LogisticsAggregateType;
  aggregateId: string;
  tenantId: string;
  actorId: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string | null;
  schemaVersion: number;
  payload: T;
}
