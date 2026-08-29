/**
 * ePOD (Electronic Proof of Delivery) Domain Types (Pure TypeScript - Domain Layer)
 * Represents legal evidence assets, electronic signature, and receiver verification.
 */

export type EPODAssetType =
  | 'electronic_signature'
  | 'goods_overview'
  | 'roll_label'
  | 'defect_proof';

export interface EPODEvidenceAsset {
  id?: string;
  assetType: EPODAssetType;
  storagePath: string;
  fileSizeBytes: number;
  mimeType: string;
  contentHash: string; // SHA-256
  capturedAt: string;
  telemetryLat?: number;
  telemetryLng?: number;
  metadata?: Record<string, unknown>;
}

export type ReceiverIdentityType = 'cccd' | 'driver_license' | 'employee_badge';

export interface ReceiverIdentity {
  name: string;
  phone?: string;
  identityType?: ReceiverIdentityType;
  identityValue?: string;
}

export type EPODVerificationStatus = 'verified' | 'disputed';

export interface EPODEvidence {
  id: string;
  tenantId: string;
  attemptId: string;
  receiver: ReceiverIdentity;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  deviceId: string;
  submittedBy: string;
  submittedAt: string;
  evidenceHash: string; // SHA-256 hash chain
  previousEvidenceHash?: string | null;
  verificationStatus: EPODVerificationStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  assets?: EPODEvidenceAsset[];
}
