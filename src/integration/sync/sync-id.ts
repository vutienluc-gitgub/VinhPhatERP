/**
 * Deterministic Sync ID Generator
 *
 * Creates a fixed sync_id based on the identity of a sync version.
 * Retry N times always returns the same sync_id.
 *
 * Identity = entity_type + entity_id + version + connection_id
 *
 * Example:
 *   shipment A + version 1             -> sync_id #ABC
 *   shipment A + version 2             -> sync_id #DEF  (different -- new version)
 *   shipment A + version 1 (retry)     -> sync_id #ABC  (same -- idempotent)
 *   shipment A + version 1 (retry x10) -> sync_id #ABC  (same -- always idempotent)
 */

export async function generateDeterministicSyncId(
  entityType: string,
  entityId: string,
  version: number,
  connectionId: string,
): Promise<string> {
  const input = `${entityType}:${entityId}:${version}:${connectionId}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
