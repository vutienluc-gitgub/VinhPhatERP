import {
  formatCurrency as coreFormatCurrency,
  formatCompactCurrency as coreFormatCompactCurrency,
  formatCurrencyFull as coreFormatCurrencyFull,
  formatQuantity as coreFormatQuantity,
} from '@/shared/value/core/formatter';

/**
 * @deprecated Use formatCurrency from '@/shared/value/core/formatter' instead
 */
export function formatCurrency(value: number): string {
  // To ensure 100% backward compatibility with the exact old behavior,
  // we cast value to number, but coreFormatCurrency handles null gracefully anyway.
  return coreFormatCurrency(value);
}

/**
 * @deprecated Use formatCompactCurrency from '@/shared/value/core/formatter' instead
 */
export function formatCompactCurrency(value: number): string {
  return coreFormatCompactCurrency(value);
}

/**
 * @deprecated Use formatCurrencyFull from '@/shared/value/core/formatter' instead
 */
export function formatCurrencyFull(value: number | null | undefined): string {
  return coreFormatCurrencyFull(value);
}

/**
 * @deprecated Use formatQuantity from '@/shared/value/core/formatter' instead
 */
export function formatQuantity(value: number, decimals = 1): string {
  // Ensure we fallback to the exact old logic if needed, but coreFormatQuantity does it perfectly
  // The old formatQuantity didn't have a fallback, it would throw on null, but we're safe here.
  return coreFormatQuantity(value, decimals);
}

/**
 * Format a phone number to 4-3-3 chunks for readability in Vietnam.
 * @example formatPhoneNumber('0848587387') // "0848 587 387"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Sanitize search keyword to help find phone numbers easily.
 * Converts "+84 848 587 387" or "0848 587 387" into "0848587387".
 */
export function sanitizePhoneSearchQuery(query: string): string {
  if (!query) return query;
  // If query contains only digits, spaces, plus, minus, or dots, it might be a phone number
  const isPhoneNumber = /^[+.\s0-9-]{8,16}$/.test(query);
  if (isPhoneNumber) {
    let sanitized = query.replace(/[.\s-]/g, '');
    if (sanitized.startsWith('+84')) {
      sanitized = '0' + sanitized.slice(3);
    } else if (sanitized.startsWith('84') && sanitized.length === 11) {
      sanitized = '0' + sanitized.slice(2);
    }
    return sanitized;
  }
  return query;
}
