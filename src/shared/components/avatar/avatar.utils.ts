/**
 * Avatar Utilities — Deterministic seed & initials generator
 */

export const AVATAR_COLOR_COUNT = 6;

/**
 * Deterministically computes a color index (0 to 5) from a user ID / UUID.
 * Ensures the same user always receives the exact same avatar background.
 */
export function getAvatarColorIndex(userId?: string | null): number {
  if (!userId) return 0;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLOR_COUNT;
}

/**
 * Generates uppercase Initials from full name.
 * - "Nguyễn Văn An" -> "NA"
 * - "Trần Minh Đức" -> "TD"
 * - "John Smith" -> "JS"
 * - "Admin" -> "AD"
 * - null/empty -> "VP"
 */
export function getInitials(name?: string | null, fallback = 'VP'): string {
  const cleanName = name?.trim();
  if (!cleanName) return fallback;

  // Normalize Vietnamese diacritics to clean uppercase letters (e.g. "Đức" -> "D")
  const normalized = cleanName
    .replace(/[đĐ]/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;

  if (words.length === 1) {
    const word = words[0] ?? '';
    return word.slice(0, 2).toUpperCase();
  }

  const firstChar = words[0]?.[0] ?? '';
  const lastChar = words[words.length - 1]?.[0] ?? '';
  return (firstChar + lastChar).toUpperCase();
}
