export interface ValueFormatterOptions {
  compact?: boolean;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  fallback?: string;
  padTrailingZeros?: boolean;
}

/**
 * Lõi định dạng dữ liệu định lượng của toàn ERP
 */
export function formatValue(
  value: number | null | undefined,
  options: ValueFormatterOptions = {},
): string {
  const {
    compact = false,
    decimals = 0,
    suffix = '',
    prefix = '',
    fallback = '—',
    padTrailingZeros = false,
  } = options;

  if (value === null || value === undefined) {
    return fallback;
  }

  const abs = Math.abs(value);
  let formattedNumber = '';

  if (compact) {
    if (abs >= 1_000_000_000) {
      formattedNumber = `${(value / 1_000_000_000).toLocaleString('vi-VN', {
        maximumFractionDigits: 1,
      })} Tỷ`;
    } else if (abs >= 1_000_000) {
      formattedNumber = `${(value / 1_000_000).toLocaleString('vi-VN', {
        maximumFractionDigits: 1,
      })} Tr`;
    } else if (abs >= 1_000) {
      formattedNumber = `${(value / 1_000).toLocaleString('vi-VN', {
        maximumFractionDigits: 1,
      })}K`;
    } else {
      formattedNumber = value.toLocaleString('vi-VN', {
        minimumFractionDigits: padTrailingZeros ? decimals : 0,
        maximumFractionDigits: decimals,
      });
    }
  } else {
    formattedNumber = value.toLocaleString('vi-VN', {
      minimumFractionDigits: padTrailingZeros ? decimals : 0,
      maximumFractionDigits: decimals,
    });
  }

  // Gắn prefix/suffix. Dùng join(' ').trim() để đảm bảo khoảng cách chuẩn
  const parts = [];
  if (prefix) parts.push(prefix);
  parts.push(formattedNumber);
  if (suffix) parts.push(suffix);

  return parts.join(' ').trim();
}

/**
 * Format riêng cho Tiền (Money).
 * Mặc định không có suffix. Dev có thể truyền { suffix: 'đ' } nếu cần.
 */
export function formatCurrency(
  value: number | null | undefined,
  options: ValueFormatterOptions = {},
): string {
  // Tiền VN mặc định không có số thập phân
  return formatValue(value, { decimals: 0, ...options });
}

/**
 * Format tương thích ngược cho tính năng cũ
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

export function formatCurrencyFull(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

/**
 * Format chuyên biệt cho Quantity (Số lượng, Cân nặng, Chiều dài)
 */
export function formatQuantity(
  value: number | null | undefined,
  decimals = 1,
  suffix = '',
): string {
  if (value == null) return '—';
  // Không dùng compact cho số lượng, trừ khi có option khác
  return formatValue(value, { decimals, suffix });
}
