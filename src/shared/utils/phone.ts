/**
 * Phone number utility functions for normalization, formatting, and link generation.
 */

/**
 * Normalizes a phone number to standard Vietnam format (starting with 0, 10 digits).
 * Examples:
 * +84916963046 -> 0916963046
 * 84916963046 -> 0916963046
 * 0916 963 046 -> 0916963046
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');

  // Handle country code +84 or 84
  if (
    cleaned.startsWith('84') &&
    (cleaned.length === 11 || cleaned.length === 12)
  ) {
    cleaned = '0' + cleaned.slice(2);
  }

  return cleaned;
}

export const MOBILE_PREFIXES = ['03', '05', '07', '08', '09'];

/**
 * Checks if a normalized phone number is a valid Vietnam mobile phone number.
 */
export function isVietnamMobile(normalizedPhone: string): boolean {
  if (normalizedPhone.length !== 10) return false;
  return MOBILE_PREFIXES.some((prefix) => normalizedPhone.startsWith(prefix));
}

/**
 * Checks if a normalized phone number is a valid Vietnam landline or other valid number (legacy).
 * Keeps backward compatibility with isVietnamPhone
 */
export function isVietnamPhone(normalizedPhone: string): boolean {
  return normalizedPhone.startsWith('0') && normalizedPhone.length === 10;
}

/**
 * Validates a phone number string (used in Zod schemas).
 * Ensures that if it looks like a mobile number, it has exactly 10 digits.
 */
export function validatePhone(phone: string | null | undefined): boolean {
  if (!phone) return true; // Allow empty
  const normalized = normalizePhone(phone);

  // If it starts with a mobile prefix, it must be exactly 10 digits
  if (MOBILE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return normalized.length === 10;
  }

  // Otherwise, allow it (could be landline, international, etc. constrained by basic regex in schema)
  return true;
}

/**
 * Format a phone number to 4-3-3 chunks for readability in Vietnam.
 * @example formatPhoneNumber('0848587387') // "0848 587 387"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const normalized = normalizePhone(phone);

  if (isVietnamPhone(normalized)) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
  }

  return phone; // Return original if not recognized
}

export function toTelHref(normalizedPhone: string): string {
  return `tel:${normalizedPhone}`;
}

export function toZaloHref(normalizedPhone: string): string {
  return `https://zalo.me/${normalizedPhone}`;
}
