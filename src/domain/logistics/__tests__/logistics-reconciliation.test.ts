import { describe, it, expect } from 'vitest';

import {
  checkStopsVsShipmentInvariant,
  checkAttemptVsEvidenceInvariant,
  checkOutboxHealthInvariant,
} from '@/domain/logistics/reconciliation/reconciliation-checker';

describe('Logistics Reconciliation Checker Invariants', () => {
  it('detects when all stops are delivered but shipment is not updated', () => {
    const violations = checkStopsVsShipmentInvariant({
      shipmentId: 'ship-01',
      shipmentStatus: 'in_transit',
      stops: [
        { id: 'stop-01', status: 'delivered' },
        { id: 'stop-02', status: 'delivered' },
      ],
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]?.invariantName).toBe('STOP_SHIPMENT_STATUS_ALIGNMENT');
    expect(violations[0]?.severity).toBe('HIGH');
  });

  it('detects when shipment is prematurely marked delivered while stops are still pending', () => {
    const violations = checkStopsVsShipmentInvariant({
      shipmentId: 'ship-02',
      shipmentStatus: 'delivered',
      stops: [
        { id: 'stop-01', status: 'delivered' },
        { id: 'stop-02', status: 'pending' },
      ],
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]?.invariantName).toBe('PREMATURE_DELIVERED_SHIPMENT');
    expect(violations[0]?.severity).toBe('CRITICAL');
  });

  it('detects delivered attempt missing legal ePOD evidence record', () => {
    const v1 = checkAttemptVsEvidenceInvariant({
      attemptId: 'att-01',
      attemptState: 'delivered',
      hasEvidence: false,
    });
    expect(v1).toHaveLength(1);
    expect(v1[0]?.invariantName).toBe('MISSING_EPOD_LEGAL_RECORD');

    const v2 = checkAttemptVsEvidenceInvariant({
      attemptId: 'att-02',
      attemptState: 'delivered',
      hasEvidence: true,
    });
    expect(v2).toHaveLength(0);
  });

  it('detects stuck transactional outbox events exceeding threshold', () => {
    const halfHourAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const v1 = checkOutboxHealthInvariant({
      eventId: 'evt-01',
      status: 'pending',
      createdAt: halfHourAgo,
      thresholdMinutes: 15,
    });
    expect(v1).toHaveLength(1);
    expect(v1[0]?.invariantName).toBe('STUCK_TRANSACTIONAL_OUTBOX_EVENT');

    const justNow = new Date().toISOString();
    const v2 = checkOutboxHealthInvariant({
      eventId: 'evt-02',
      status: 'pending',
      createdAt: justNow,
      thresholdMinutes: 15,
    });
    expect(v2).toHaveLength(0);
  });
});
