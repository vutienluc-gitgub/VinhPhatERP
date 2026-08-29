import type { EPODEvidenceAsset, ReceiverIdentity } from './epod.types';

export interface ComputeHashPayload {
  attemptId: string;
  receiver: ReceiverIdentity;
  latitude: number;
  longitude: number;
  deviceId: string;
  submittedAt: string;
  assets: Array<
    Pick<EPODEvidenceAsset, 'assetType' | 'storagePath' | 'contentHash'>
  >;
  previousEvidenceHash?: string | null;
}

/**
 * Builds the canonical deterministic string representation of the ePOD evidence for hashing.
 */
export function buildCanonicalEvidenceString(
  payload: ComputeHashPayload,
): string {
  const sortedAssets = [...payload.assets].sort((a, b) =>
    a.storagePath.localeCompare(b.storagePath),
  );

  const parts = [
    `attempt:${payload.attemptId}`,
    `receiver_name:${payload.receiver.name.trim()}`,
    `receiver_phone:${(payload.receiver.phone ?? '').trim()}`,
    `receiver_id_type:${payload.receiver.identityType ?? ''}`,
    `receiver_id_val:${payload.receiver.identityValue ?? ''}`,
    `lat:${payload.latitude.toFixed(6)}`,
    `lng:${payload.longitude.toFixed(6)}`,
    `device:${payload.deviceId.trim()}`,
    `time:${payload.submittedAt}`,
    `assets:${sortedAssets.map((a) => `${a.assetType}:${a.contentHash}`).join(',')}`,
    `prev_hash:${payload.previousEvidenceHash ?? 'GENESIS'}`,
  ];

  return parts.join('|');
}

/**
 * Computes SHA-256 hash using Web Crypto API.
 */
export async function computeEvidenceHash(
  payload: ComputeHashPayload,
): Promise<string> {
  const canonical = buildCanonicalEvidenceString(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);

  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
