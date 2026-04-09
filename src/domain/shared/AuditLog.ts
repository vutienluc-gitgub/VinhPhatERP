/**
 * AuditLog — shared domain type dùng chung cho tất cả entities.
 * Pure TypeScript, không phụ thuộc React hay Supabase.
 */

export type AuditEntityType = 'contract' | 'order' | 'quotation';

export type AuditEntry = {
  entity_type: AuditEntityType;
  entity_id: string;
  action: string;
  actor_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  timestamp: string;
};

export function buildAuditEntry(
  entityType: AuditEntityType,
  entityId: string,
  actorId: string,
  action: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
): AuditEntry {
  return {
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_id: actorId,
    before,
    after,
    timestamp: new Date().toISOString(),
  };
}
