import { describe, it, expect } from 'vitest';

import { generateDeterministicSyncId } from '@/integration/sync/sync-id';

describe('generateDeterministicSyncId', () => {
  it('should generate a 64-character lowercase hex string (SHA-256)', async () => {
    const syncId = await generateDeterministicSyncId(
      'shipment',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      1,
      'conn-123',
    );

    expect(syncId).toHaveLength(64);
    expect(syncId).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should be deterministic — identical inputs yield identical sync_id', async () => {
    const id1 = await generateDeterministicSyncId(
      'shipment',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      1,
      'conn-123',
    );

    const id2 = await generateDeterministicSyncId(
      'shipment',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      1,
      'conn-123',
    );

    expect(id1).toBe(id2);
  });

  it('should change sync_id when version changes (OCC)', async () => {
    const v1 = await generateDeterministicSyncId(
      'shipment',
      'item-1',
      1,
      'conn-1',
    );
    const v2 = await generateDeterministicSyncId(
      'shipment',
      'item-1',
      2,
      'conn-1',
    );

    expect(v1).not.toBe(v2);
  });

  it('should change sync_id when entityId changes', async () => {
    const idA = await generateDeterministicSyncId(
      'shipment',
      'item-1',
      1,
      'conn-1',
    );
    const idB = await generateDeterministicSyncId(
      'shipment',
      'item-2',
      1,
      'conn-1',
    );

    expect(idA).not.toBe(idB);
  });

  it('should change sync_id when entityType changes', async () => {
    const idShipment = await generateDeterministicSyncId(
      'shipment',
      'id-1',
      1,
      'conn-1',
    );
    const idOrder = await generateDeterministicSyncId(
      'order',
      'id-1',
      1,
      'conn-1',
    );

    expect(idShipment).not.toBe(idOrder);
  });

  it('should change sync_id when connectionId changes', async () => {
    const idConnA = await generateDeterministicSyncId(
      'shipment',
      'id-1',
      1,
      'conn-A',
    );
    const idConnB = await generateDeterministicSyncId(
      'shipment',
      'id-1',
      1,
      'conn-B',
    );

    expect(idConnA).not.toBe(idConnB);
  });
});
