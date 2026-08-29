/**
 * Logistics Reconciliation Domain Types (Pure TypeScript - Domain Layer)
 */

export interface InvariantViolation {
  invariantName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  entityType:
    | 'shipment'
    | 'delivery_stop'
    | 'delivery_attempt'
    | 'epod_evidence'
    | 'outbox_event';
  entityId: string;
  details: string;
}

export interface ReconcileStopsVsShipmentInput {
  shipmentId: string;
  shipmentStatus: string;
  stops: Array<{ id: string; status: string }>;
}

export interface ReconcileAttemptVsEvidenceInput {
  attemptId: string;
  attemptState: string;
  hasEvidence: boolean;
}

export interface ReconcileOutboxHealthInput {
  eventId: string;
  status: string;
  createdAt: string;
  currentTime?: string;
  thresholdMinutes?: number;
}
