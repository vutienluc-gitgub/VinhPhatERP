/**
 * Identifier Service — Centralized data builder for QR, Barcode & RFID.
 *
 * ALL code-generation logic MUST go through this service so that:
 *   1. Data format is consistent across every module
 *   2. QR payloads are JSON-versioned (forward-compatible)
 *   3. Barcode values are short & scanner-friendly
 *   4. RFID contract is reserved for future hardware integration
 *
 * Pure TypeScript — no React or Supabase dependency.
 */

/* ─── Entity Types ─── */

/** Supported identifier entity types */
export type IdentifierEntity =
  | 'yarn_lot'
  | 'fabric_catalog'
  | 'fabric_roll'
  | 'shipment';

/** Supported encoding targets */
export type IdentifierTarget = 'qr' | 'barcode' | 'rfid';

/* ─── QR Payload (JSON Versioned) ─── */

/** Version 1 QR payload — JSON-based with schema versioning */
export type QRPayloadV1 = {
  /** Schema version for forward-compatibility */
  v: 1;
  /** Entity type */
  t: IdentifierEntity;
  /** Primary identifier (lot number, catalog id, roll id, etc.) */
  id: string;
  /** Optional metadata key-value pairs */
  meta?: Record<string, string | number>;
  /** Created timestamp (epoch seconds) */
  ts: number;
};

/* ─── Barcode Prefixes ─── */

const BARCODE_PREFIX: Record<IdentifierEntity, string> = {
  yarn_lot: 'VP-YL',
  fabric_catalog: 'VP-FC',
  fabric_roll: 'VP-FR',
  shipment: 'VP-SH',
};

/* ─── Public API ─── */

/**
 * Builds a JSON-versioned QR payload string.
 *
 * @example
 * buildQRPayload('yarn_lot', '23-012522', { receipt: 'PN-001', yarn: '30/1 CVC' })
 * // => '{"v":1,"t":"yarn_lot","id":"23-012522","meta":{"receipt":"PN-001","yarn":"30/1 CVC"},"ts":1717171200}'
 */
export function buildQRPayload(
  entity: IdentifierEntity,
  id: string,
  meta?: Record<string, string | number>,
): string {
  const payload: QRPayloadV1 = {
    v: 1,
    t: entity,
    id,
    ts: Math.floor(Date.now() / 1000),
  };

  if (meta && Object.keys(meta).length > 0) {
    payload.meta = meta;
  }

  return JSON.stringify(payload);
}

/**
 * Builds a short, scanner-friendly barcode value.
 * Format: `{PREFIX}-{sanitized_id}`
 *
 * @example
 * buildBarcodeValue('yarn_lot', '23-012522')
 * // => 'VP-YL-23012522'
 */
export function buildBarcodeValue(
  entity: IdentifierEntity,
  id: string,
): string {
  const prefix = BARCODE_PREFIX[entity];
  // Remove dashes/spaces from id for barcode scanner compatibility
  const sanitizedId = id.replace(/[-\s]/g, '');
  return `${prefix}-${sanitizedId}`;
}

/**
 * Builds an RFID payload.
 *
 * Phase 2: Implement when RFID hardware is integrated.
 * Currently returns `null` to signal "not supported yet".
 * Callers MUST handle the `null` case.
 */
export function buildRFIDPayload(
  _entity: IdentifierEntity,
  _id: string,
  _meta?: Record<string, string | number>,
): string | null {
  // Phase 2: Implement when RFID hardware is integrated
  return null;
}

/**
 * Parses a raw QR string back into a typed payload.
 * Returns `null` if the string is not a valid VP QR payload.
 *
 * @example
 * parseQRPayload('{"v":1,"t":"yarn_lot","id":"23-012522","ts":1717171200}')
 * // => { v: 1, t: 'yarn_lot', id: '23-012522', ts: 1717171200 }
 */
export function parseQRPayload(raw: string): QRPayloadV1 | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('v' in parsed) ||
      !('t' in parsed) ||
      !('id' in parsed)
    ) {
      return null;
    }

    const obj = parsed as Record<string, unknown>;

    if (obj.v !== 1) {
      return null;
    }

    const validEntities: IdentifierEntity[] = [
      'yarn_lot',
      'fabric_catalog',
      'fabric_roll',
      'shipment',
    ];

    if (!validEntities.includes(obj.t as IdentifierEntity)) {
      return null;
    }

    return {
      v: 1,
      t: obj.t as IdentifierEntity,
      id: String(obj.id),
      meta:
        typeof obj.meta === 'object' && obj.meta !== null
          ? (obj.meta as Record<string, string | number>)
          : undefined,
      ts: typeof obj.ts === 'number' ? obj.ts : 0,
    };
  } catch {
    return null;
  }
}
