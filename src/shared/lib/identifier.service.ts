/**
 * Identifier Service — Centralized data builder for QR, Barcode & RFID.
 *
 * ALL code-generation logic MUST go through this service so that:
 *   1. Data format is consistent across every module
 *   2. QR payloads are URL-based (scannable by Zalo, camera, etc.)
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

/* ─── Route Mapping ─── */

/** Maps entity type to its front-end route segment */
const ENTITY_ROUTE: Record<IdentifierEntity, string> = {
  yarn_lot: '/yarn-receipts',
  fabric_catalog: '/p/fabric',
  fabric_roll: '/fabric-roll',
  shipment: '/shipments',
};

/* ─── Barcode Prefixes ─── */

const BARCODE_PREFIX: Record<IdentifierEntity, string> = {
  yarn_lot: 'VP-YL',
  fabric_catalog: 'VP-FC',
  fabric_roll: 'VP-FR',
  shipment: 'VP-SH',
};

/* ─── App Base URL ─── */

/**
 * Resolves the app's public base URL for QR codes.
 * Priority: VITE_APP_URL env > current window.location.origin > fallback
 */
function getAppBaseUrl(): string {
  // Vite env variable (set in .env.local)
  const envUrl = import.meta.env?.VITE_APP_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // Browser context — use current origin
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // Fallback (SSR or scripts)
  return 'https://erp.vinhphat.com';
}

/* ─── Public API ─── */

/**
 * Builds a URL-based QR payload string.
 * When scanned by Zalo or any camera app, opens directly in the ERP.
 *
 * @example
 * buildQRPayload('fabric_catalog', 'a0ee27d0-...', { code: 'FC-008', name: 'Vải bo gân' })
 * // => 'https://erp.vinhphat.com/fabric-catalog/a0ee27d0-...'
 *
 * @example
 * buildQRPayload('yarn_lot', '23-012522', { receipt: 'PN-001', yarn: '30/1 CVC' })
 * // => 'https://erp.vinhphat.com/yarn-receipts?lot=23-012522'
 */
export function buildQRPayload(
  entity: IdentifierEntity,
  id: string,
  _meta?: Record<string, string | number>,
): string {
  const baseUrl = getAppBaseUrl();
  const route = ENTITY_ROUTE[entity];

  // yarn_lot uses lot_number as id — navigate via query param
  if (entity === 'yarn_lot') {
    return `${baseUrl}${route}?lot=${encodeURIComponent(id)}`;
  }

  // Other entities use UUID-based id — navigate to detail page
  return `${baseUrl}${route}/${encodeURIComponent(id)}`;
}

/**
 * Builds a JSON-versioned QR payload string (legacy format).
 * Use buildQRPayload() for new code — this is kept for backward compatibility
 * with industrial barcode scanners that parse JSON payloads.
 *
 * @example
 * buildQRPayloadJSON('yarn_lot', '23-012522', { receipt: 'PN-001' })
 * // => '{"v":1,"t":"yarn_lot","id":"23-012522","meta":{"receipt":"PN-001"},"ts":1717171200}'
 */
export function buildQRPayloadJSON(
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
 * Supports both URL format (v2) and legacy JSON format (v1).
 * Returns `null` if the string is not a valid VP QR payload.
 *
 * @example
 * parseQRPayload('https://erp.vinhphat.com/fabric-catalog/abc-123')
 * // => { v: 1, t: 'fabric_catalog', id: 'abc-123', ts: 0 }
 *
 * parseQRPayload('{"v":1,"t":"yarn_lot","id":"23-012522","ts":1717171200}')
 * // => { v: 1, t: 'yarn_lot', id: '23-012522', ts: 1717171200 }
 */
export function parseQRPayload(raw: string): QRPayloadV1 | null {
  // Try URL format first
  const urlResult = parseQRUrl(raw);
  if (urlResult) return urlResult;

  // Fall back to legacy JSON format
  return parseQRJson(raw);
}

/* ─── Internal Parsers ─── */

function parseQRUrl(raw: string): QRPayloadV1 | null {
  try {
    const url = new URL(raw);

    // Check yarn_lot via query param
    const lotParam = url.searchParams.get('lot');
    if (lotParam && url.pathname.includes('/yarn-receipts')) {
      return { v: 1, t: 'yarn_lot', id: decodeURIComponent(lotParam), ts: 0 };
    }

    // Check path-based entities: /fabric-catalog/:id, /fabric-roll/:id, etc.
    const routeEntries = Object.entries(ENTITY_ROUTE) as [
      IdentifierEntity,
      string,
    ][];
    for (const [entity, route] of routeEntries) {
      if (entity === 'yarn_lot') continue; // handled above
      if (url.pathname.startsWith(route + '/')) {
        const id = decodeURIComponent(
          url.pathname.slice(route.length + 1).replace(/\/$/, ''),
        );
        if (id) {
          return { v: 1, t: entity, id, ts: 0 };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

function parseQRJson(raw: string): QRPayloadV1 | null {
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
