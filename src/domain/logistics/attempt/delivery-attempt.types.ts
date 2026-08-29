/**
 * Delivery Attempt Domain Types (Pure TypeScript - Domain Layer)
 * Represents a concrete physical execution run for a delivery stop.
 */

export type DeliveryAttemptState =
  | 'assigned'
  | 'pending_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'failed_attempt'
  | 'completed'
  | 'returned'
  | 'cancelled';

export interface TelemetryLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  capturedAt: string;
  deviceId: string;
}

export interface DeliveryAttempt {
  id: string;
  tenantId: string;
  stopId: string;
  attemptNumber: number;
  driverId: string | null;
  vehiclePlate: string | null;
  state: DeliveryAttemptState;
  correlationId: string;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
