import type {
  InvariantViolation,
  ReconcileStopsVsShipmentInput,
  ReconcileAttemptVsEvidenceInput,
  ReconcileOutboxHealthInput,
} from './reconciliation.types';

/**
 * Checks Invariant 1: Alignment between Stops and Shipment Status.
 */
export function checkStopsVsShipmentInvariant(
  input: ReconcileStopsVsShipmentInput,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  if (input.stops.length === 0) return violations;

  const allStopsDelivered = input.stops.every((s) => s.status === 'delivered');
  const hasPendingOrInProgress = input.stops.some(
    (s) => s.status === 'pending' || s.status === 'in_progress',
  );

  if (allStopsDelivered && input.shipmentStatus !== 'delivered') {
    violations.push({
      invariantName: 'STOP_SHIPMENT_STATUS_ALIGNMENT',
      severity: 'HIGH',
      entityType: 'shipment',
      entityId: input.shipmentId,
      details: `Toàn bộ ${input.stops.length} điểm dừng đã giao xong ('delivered'), nhưng shipment.status vẫn là '${input.shipmentStatus}'`,
    });
  }

  if (hasPendingOrInProgress && input.shipmentStatus === 'delivered') {
    violations.push({
      invariantName: 'PREMATURE_DELIVERED_SHIPMENT',
      severity: 'CRITICAL',
      entityType: 'shipment',
      entityId: input.shipmentId,
      details: `Chuyến hàng đang ở trạng thái 'delivered' nhưng vẫn còn điểm dừng chưa giao xong`,
    });
  }

  return violations;
}

/**
 * Checks Invariant 2: Delivered/Completed Attempt MUST have ePOD Evidence.
 */
export function checkAttemptVsEvidenceInvariant(
  input: ReconcileAttemptVsEvidenceInput,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  const isDeliveredState =
    input.attemptState === 'delivered' || input.attemptState === 'completed';

  if (isDeliveredState && !input.hasEvidence) {
    violations.push({
      invariantName: 'MISSING_EPOD_LEGAL_RECORD',
      severity: 'CRITICAL',
      entityType: 'delivery_attempt',
      entityId: input.attemptId,
      details: `Lần giao hàng đã đạt trạng thái '${input.attemptState}' nhưng thiếu bản ghi chứng từ pháp lý shipment_epod_evidences`,
    });
  }

  return violations;
}

/**
 * Checks Invariant 4: Outbox Pending Latency Health.
 */
export function checkOutboxHealthInvariant(
  input: ReconcileOutboxHealthInput,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  if (input.status !== 'pending') return violations;

  const createdTime = new Date(input.createdAt).getTime();
  const nowTime = input.currentTime
    ? new Date(input.currentTime).getTime()
    : Date.now();
  const thresholdMs = (input.thresholdMinutes ?? 15) * 60 * 1000;

  if (nowTime - createdTime > thresholdMs) {
    const elapsedMinutes = Math.round((nowTime - createdTime) / 60000);
    violations.push({
      invariantName: 'STUCK_TRANSACTIONAL_OUTBOX_EVENT',
      severity: 'HIGH',
      entityType: 'outbox_event',
      entityId: input.eventId,
      details: `Sự kiện Outbox bị kẹt ở trạng thái 'pending' hơn ${elapsedMinutes} phút`,
    });
  }

  return violations;
}
