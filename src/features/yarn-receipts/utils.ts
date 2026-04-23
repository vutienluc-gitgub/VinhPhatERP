import { formatCurrency } from '@/shared/utils/format';

import type { YarnReceipt } from './types';

/**
 * Extracts valid (non-NaN, positive) unit prices from a receipt's items.
 */
function extractValidPrices(receipt: YarnReceipt): number[] {
  if (!receipt.yarn_receipt_items || receipt.yarn_receipt_items.length === 0) {
    return [];
  }

  return receipt.yarn_receipt_items
    .map((item) => Number(item.unit_price))
    .filter((p) => !isNaN(p) && p > 0);
}

/**
 * Calculates and formats the display string for the unit prices of a yarn receipt.
 * Extracts unique valid prices and returns a formatted range or single price.
 */
export function getReceiptUnitPriceDisplay(receipt: YarnReceipt): string {
  const prices = extractValidPrices(receipt);

  if (prices.length === 0) {
    return '—';
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return `${formatCurrency(min)}đ`;
  }

  return `${formatCurrency(min)}đ - ${formatCurrency(max)}đ`;
}

/**
 * Returns the average unit price (numeric) for sorting purposes.
 * Returns null when no valid prices exist.
 */
export function getReceiptAvgUnitPrice(receipt: YarnReceipt): number | null {
  const prices = extractValidPrices(receipt);

  if (prices.length === 0) {
    return null;
  }

  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}
