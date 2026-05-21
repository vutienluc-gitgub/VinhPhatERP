/**
 * Format a number as Vietnamese currency (VNĐ).
 * Does NOT append the "đ" suffix — callers add it if needed.
 *
 * @example formatCurrency(1500000) // "1.500.000"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Format a number as compact Vietnamese currency for KPI cards.
 * Abbreviates large values to avoid text overflow.
 *
 * @example formatCompactCurrency(135_740_000) // "135.7 Tr"
 * @example formatCompactCurrency(2_500_000_000) // "2.5 Tỷ"
 * @example formatCompactCurrency(500_000) // "500.000 đ"
 */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tr`;
  }
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

/**
 * Format an optional number as Vietnamese currency with the ₫ symbol.
 * Returns '—' for null/undefined values.
 *
 * @example formatCurrencyFull(1500000) // "1.500.000 ₫"
 * @example formatCurrencyFull(null)     // "—"
 */
export function formatCurrencyFull(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

/**
 * Format a numeric quantity with locale-aware separators.
 * Used for weights (kg), lengths (m), and general counts.
 *
 * @example formatQuantity(12500.5)    // "12.500,5"
 * @example formatQuantity(100, 0)     // "100"
 */
export function formatQuantity(value: number, decimals = 1): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: decimals });
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
