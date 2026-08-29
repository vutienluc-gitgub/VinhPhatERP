import { describe, it, expect } from 'vitest';

import {
  buildCanonicalEvidenceString,
  computeEvidenceHash,
  type ComputeHashPayload,
} from '@/domain/logistics/epod/epod-hash';

describe('ePOD Evidence Hash Chain', () => {
  const basePayload: ComputeHashPayload = {
    attemptId: 'att-12345',
    receiver: {
      name: 'Nguyen Van A',
      phone: '0987654321',
      identityType: 'cccd',
      identityValue: '001234567890',
    },
    latitude: 10.762622,
    longitude: 106.660172,
    deviceId: 'device-iphone-15',
    submittedAt: '2026-08-29T10:00:00.000Z',
    assets: [
      {
        assetType: 'electronic_signature',
        storagePath: 'epod-evidence/sig-01.png',
        contentHash: 'hash-signature-sha256',
      },
      {
        assetType: 'goods_overview',
        storagePath: 'epod-evidence/photo-01.webp',
        contentHash: 'hash-photo-sha256',
      },
    ],
    previousEvidenceHash: 'prev-hash-genesis',
  };

  it('builds a deterministic canonical string regardless of asset insertion order', () => {
    const payloadShuffled: ComputeHashPayload = {
      ...basePayload,
      assets: [...basePayload.assets].reverse(),
    };

    const s1 = buildCanonicalEvidenceString(basePayload);
    const s2 = buildCanonicalEvidenceString(payloadShuffled);

    expect(s1).toBe(s2);
    expect(s1).toContain('attempt:att-12345');
    expect(s1).toContain('receiver_name:Nguyen Van A');
  });

  it('computes a valid 64-character SHA-256 hexadecimal string', async () => {
    const hash = await computeEvidenceHash(basePayload);
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it('detects even the slightest tamper with receiver name or GPS', async () => {
    const originalHash = await computeEvidenceHash(basePayload);

    // Tamper with receiver name
    const tamperedNamePayload: ComputeHashPayload = {
      ...basePayload,
      receiver: { ...basePayload.receiver, name: 'Nguyen Van B' },
    };
    const tamperedNameHash = await computeEvidenceHash(tamperedNamePayload);
    expect(tamperedNameHash).not.toBe(originalHash);

    // Tamper with GPS coordinate by 0.00001
    const tamperedGpsPayload: ComputeHashPayload = {
      ...basePayload,
      latitude: 10.762632,
    };
    const tamperedGpsHash = await computeEvidenceHash(tamperedGpsPayload);
    expect(tamperedGpsHash).not.toBe(originalHash);
  });

  it('forms a linked hash chain when previousEvidenceHash is supplied', async () => {
    const hash1 = await computeEvidenceHash(basePayload);

    const nextPayload: ComputeHashPayload = {
      ...basePayload,
      attemptId: 'att-67890',
      previousEvidenceHash: hash1, // Linked
    };

    const hash2 = await computeEvidenceHash(nextPayload);
    expect(hash2).not.toBe(hash1);
    expect(hash2).toHaveLength(64);
  });
});
