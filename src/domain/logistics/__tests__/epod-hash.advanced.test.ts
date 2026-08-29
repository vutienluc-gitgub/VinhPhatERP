import { describe, it, expect } from 'vitest';

import {
  computeEvidenceHash,
  type ComputeHashPayload,
} from '@/domain/logistics/epod/epod-hash';

describe('ePOD Hash Chain — Advanced Cryptographic & Stress Tests', () => {
  it('resiliently handles Vietnamese Unicode, extra whitespace and newlines', async () => {
    const p1: ComputeHashPayload = {
      attemptId: 'att-vn-01',
      receiver: {
        name: '   Nguyễn Thị Thu Hương   \n',
        phone: '  0989 072 670  ',
        identityType: 'cccd',
        identityValue: '079198001234',
      },
      latitude: 10.8230989,
      longitude: 106.6296638,
      deviceId: 'device-samsung-galaxy-s24',
      submittedAt: '2026-08-29T10:30:00.000Z',
      assets: [
        {
          assetType: 'electronic_signature',
          storagePath: 'signatures/sig_01.png',
          contentHash: 'hash_sig_abc123',
        },
      ],
    };

    const p2: ComputeHashPayload = {
      attemptId: 'att-vn-01',
      receiver: {
        name: 'Nguyễn Thị Thu Hương',
        phone: '0989 072 670',
        identityType: 'cccd',
        identityValue: '079198001234',
      },
      latitude: 10.823099, // slight float rounding to 6 decimals
      longitude: 106.629664,
      deviceId: 'device-samsung-galaxy-s24',
      submittedAt: '2026-08-29T10:30:00.000Z',
      assets: [
        {
          assetType: 'electronic_signature',
          storagePath: 'signatures/sig_01.png',
          contentHash: 'hash_sig_abc123',
        },
      ],
    };

    const hash1 = await computeEvidenceHash(p1);
    const hash2 = await computeEvidenceHash(p2);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('verifies a 5-node delivery hash chain and detects tampering at Node 2', async () => {
    const chainHashes: string[] = [];
    let prevHash: string | null = null;

    // Simulate 5 consecutive deliveries
    for (let i = 1; i <= 5; i++) {
      const payload: ComputeHashPayload = {
        attemptId: `att-chain-node-${i}`,
        receiver: {
          name: `Khách Hàng Số ${i}`,
          phone: `090000000${i}`,
        },
        latitude: 10.7 + i * 0.01,
        longitude: 106.6 + i * 0.01,
        deviceId: 'device-shared-driver',
        submittedAt: `2026-08-29T10:0${i}:00.000Z`,
        assets: [
          {
            assetType: 'electronic_signature',
            storagePath: `signatures/sig_${i}.png`,
            contentHash: `hash_sig_${i}`,
          },
        ],
        previousEvidenceHash: prevHash,
      };

      const currentHash = await computeEvidenceHash(payload);
      chainHashes.push(currentHash);
      prevHash = currentHash;
    }

    expect(chainHashes).toHaveLength(5);
    // All hashes must be distinct
    const uniqueHashes = new Set(chainHashes);
    expect(uniqueHashes.size).toBe(5);

    // Tampering test: modify node 2 payload
    const tamperedNode2Payload: ComputeHashPayload = {
      attemptId: 'att-chain-node-2',
      receiver: {
        name: 'Khách Hàng Đã Bị Sửa Tên',
        phone: '0900000002',
      },
      latitude: 10.72,
      longitude: 106.62,
      deviceId: 'device-shared-driver',
      submittedAt: '2026-08-29T10:02:00.000Z',
      assets: [
        {
          assetType: 'electronic_signature',
          storagePath: 'signatures/sig_2.png',
          contentHash: 'hash_sig_2',
        },
      ],
      previousEvidenceHash: chainHashes[0], // Linked to node 1
    };

    const tamperedNode2Hash = await computeEvidenceHash(tamperedNode2Payload);
    // Node 2 hash changed
    expect(tamperedNode2Hash).not.toBe(chainHashes[1]);

    // Recalculating Node 3 with tampered node 2 hash
    const node3PayloadWithTamperedPrev: ComputeHashPayload = {
      attemptId: 'att-chain-node-3',
      receiver: {
        name: 'Khách Hàng Số 3',
        phone: '0900000003',
      },
      latitude: 10.73,
      longitude: 106.63,
      deviceId: 'device-shared-driver',
      submittedAt: '2026-08-29T10:03:00.000Z',
      assets: [
        {
          assetType: 'electronic_signature',
          storagePath: 'signatures/sig_3.png',
          contentHash: 'hash_sig_3',
        },
      ],
      previousEvidenceHash: tamperedNode2Hash,
    };

    const node3HashNew = await computeEvidenceHash(
      node3PayloadWithTamperedPrev,
    );
    // Node 3 hash also changes -> chain broken!
    expect(node3HashNew).not.toBe(chainHashes[2]);
  });

  it('handles large number of assets (20 assets) deterministically', async () => {
    const assets: Array<{
      assetType: 'electronic_signature' | 'roll_label';
      storagePath: string;
      contentHash: string;
    }> = Array.from({ length: 20 }, (_, idx) => ({
      assetType: idx === 0 ? 'electronic_signature' : 'roll_label',
      storagePath: `storage/path/roll_${String(idx).padStart(2, '0')}.jpg`,
      contentHash: `sha256_dummy_hash_${idx}`,
    }));

    // Shuffle assets
    const shuffledAssets = [...assets].sort(() => Math.random() - 0.5);

    const payload1: ComputeHashPayload = {
      attemptId: 'att-multi-asset',
      receiver: { name: 'Cong ty May A' },
      latitude: 10.5,
      longitude: 106.5,
      deviceId: 'dev-01',
      submittedAt: '2026-08-29T10:00:00Z',
      assets,
    };

    const payload2: ComputeHashPayload = {
      attemptId: 'att-multi-asset',
      receiver: { name: 'Cong ty May A' },
      latitude: 10.5,
      longitude: 106.5,
      deviceId: 'dev-01',
      submittedAt: '2026-08-29T10:00:00Z',
      assets: shuffledAssets,
    };

    const hash1 = await computeEvidenceHash(payload1);
    const hash2 = await computeEvidenceHash(payload2);

    expect(hash1).toBe(hash2);
  });
});
