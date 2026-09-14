/**
 * Chat Party & Alignment Domain Model
 * Separates 3 distinct concepts:
 * 1. sender_id: Physical actor (User UUID)
 * 2. participant_party: Organizational boundary ('internal' vs 'external')
 * 3. message_side: Visual rendering side ('right' vs 'left')
 */

export type ChatParticipantParty = 'internal' | 'external';
export type ChatMessageSide = 'right' | 'left';

const INTERNAL_ROLES = new Set([
  'admin',
  'manager',
  'staff',
  'kho',
  'accountant',
  'operator',
  'supervisor',
  'sale',
  'sales',
]);

/**
 * Resolves whether a sender role belongs to the Internal Enterprise Team (Vinh Phat)
 * or External Party (Customer / Driver / Supplier / Partner).
 */
export function resolveParticipantParty(
  senderRole?: string | null,
): ChatParticipantParty {
  if (!senderRole) return 'external';
  return INTERNAL_ROLES.has(senderRole.toLowerCase().trim())
    ? 'internal'
    : 'external';
}

/**
 * Resolves visual render side (right vs left) based on party and portal perspective.
 *
 * Architectural Invariant:
 * - `isMine` MUST represent the exact authenticated viewer (`currentUser.id === sender_id`),
 *   never the sender's party/role.
 * - `side = right` MUST mean `isSelfSender === true` (isMine).
 * - Every other sender MUST align `left` with their authentic name and initials,
 *   regardless of portal perspective (Admin, Customer, or Driver).
 */
export function resolveMessageSide(
  _party: ChatParticipantParty,
  _perspective: 'internal' | 'external' = 'internal',
  isSelfSender = false,
): ChatMessageSide {
  return isSelfSender ? 'right' : 'left';
}
