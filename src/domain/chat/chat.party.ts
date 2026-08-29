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
 * Business Invariant:
 * - On Admin Portal (Perspective: 'internal'):
 *   ALL Internal messages (Staff A, Staff B, Manager, Admin) align RIGHT (Blue/Primary).
 *   External messages (Customer, Driver) align LEFT (Outline/Secondary).
 *
 * - On External Portals (Perspective: 'external'):
 *   Self-sent messages align RIGHT.
 *   Factory/Admin messages align LEFT.
 */
export function resolveMessageSide(
  party: ChatParticipantParty,
  perspective: 'internal' | 'external' = 'internal',
  isSelfSender = false,
): ChatMessageSide {
  if (perspective === 'internal') {
    return party === 'internal' || isSelfSender ? 'right' : 'left';
  }
  return isSelfSender ? 'right' : 'left';
}
