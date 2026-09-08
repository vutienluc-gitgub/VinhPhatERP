import { describe, it, expect, beforeEach } from 'vitest';

import {
  enqueueOfflineCommand,
  getPendingOfflineCommands,
  flushOfflineQueue,
} from '@/features/driver-portal/services/offline-command-queue';
import { computeEvidenceHash } from '@/domain/logistics';

describe('ePOD & Offline Sync Flow', () => {
  beforeEach(async () => {
    // Clear pending commands
    await flushOfflineQueue(async () => {});
  });

  it('computes deterministic evidence hash for electronic signature and photo assets', async () => {
    const attemptId = 'attempt-test-01';
    const receiver = {
      name: 'Nguyen Van A',
      phone: '0901234567',
      identityNumber: '079123456789',
    };

    const hash1 = await computeEvidenceHash({
      attemptId,
      receiver,
      latitude: 10.762622,
      longitude: 106.660172,
      deviceId: 'device-test-01',
      submittedAt: '2026-09-07T10:00:00.000Z',
      assets: [
        {
          assetType: 'electronic_signature',
          storagePath: 'signatures/sig_01.png',
          contentHash: 'hash-sig-1234567890',
        },
        {
          assetType: 'goods_overview',
          storagePath: 'photos/photo_01.webp',
          contentHash: 'hash-photo-1234567890',
        },
      ],
      previousEvidenceHash: null,
    });

    const hash2 = await computeEvidenceHash({
      attemptId,
      receiver,
      latitude: 10.762622,
      longitude: 106.660172,
      deviceId: 'device-test-01',
      submittedAt: '2026-09-07T10:00:00.000Z',
      assets: [
        {
          assetType: 'electronic_signature',
          storagePath: 'signatures/sig_01.png',
          contentHash: 'hash-sig-1234567890',
        },
        {
          assetType: 'goods_overview',
          storagePath: 'photos/photo_01.webp',
          contentHash: 'hash-photo-1234567890',
        },
      ],
      previousEvidenceHash: null,
    });

    expect(hash1).toBeDefined();
    expect(hash1.length).toBe(64); // SHA-256 hex string
    expect(hash1).toBe(hash2); // Deterministic
  });

  it('enqueues ePOD submission when device is offline and preserves payload integrity', async () => {
    const commandId = 'epod-cmd-999';
    const attemptId = 'attempt-999';

    await enqueueOfflineCommand({
      commandId,
      aggregateId: attemptId,
      commandName: 'submit_delivery_epod',
      payload: {
        commandId,
        attemptId,
        expectedState: 'arrived',
        receiver: {
          name: 'Tran Thi B',
          phone: '0912345678',
        },
        telemetry: {
          lat: 10.77,
          lng: 106.69,
          accuracy_meters: 5,
          device_id: 'driver-phone-s21',
        },
        evidenceHash: 'a'.repeat(64),
        assets: [
          {
            assetType: 'electronic_signature',
            storagePath: 'signatures/test_sig.png',
            fileSizeBytes: 15420,
            mimeType: 'image/png',
            contentHash: 'b'.repeat(64),
            capturedAt: '2026-09-07T10:00:00.000Z',
            telemetryLat: 10.77,
            telemetryLng: 106.69,
          },
        ],
      },
    });

    const pending = await getPendingOfflineCommands();
    expect(pending.length).toBe(1);
    expect(pending[0]?.commandId).toBe(commandId);
    expect(pending[0]?.commandName).toBe('submit_delivery_epod');

    // Simulate online flush
    const syncedCommands: string[] = [];
    const result = await flushOfflineQueue(async (cmd) => {
      syncedCommands.push(cmd.commandId);
    });

    expect(result.processed).toBe(1);
    expect(syncedCommands).toEqual([commandId]);

    const remaining = await getPendingOfflineCommands();
    expect(remaining.length).toBe(0);
  });
});
