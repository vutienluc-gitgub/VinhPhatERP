import { formatCurrency } from '@/shared/utils/format';

import type { YarnReceipt } from './types';

/**
 * Calculates and formats the display string for the unit prices of a yarn receipt.
 * Extracts unique valid prices and returns a formatted range or single price.
 */
export function getReceiptUnitPriceDisplay(receipt: YarnReceipt): string {
  if (!receipt.yarn_receipt_items || receipt.yarn_receipt_items.length === 0) {
    return '—';
  }

  const prices = receipt.yarn_receipt_items
    .map((item) => Number(item.unit_price))
    .filter((p) => !isNaN(p) && p > 0);

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
