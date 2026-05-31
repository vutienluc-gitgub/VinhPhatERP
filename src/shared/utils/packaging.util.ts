/**
 * Packaging formatting utility.
 *
 * Extracted from LotQRModal & LotBarcodeModal where it was duplicated.
 * Used to display packaging info (cones/box, box count, box number).
 */

const PACKAGING_LABELS = {
  conesUnit: 'côn/thùng',
  boxLabel: 'Thùng',
} as const;

/**
 * Formats packaging info from item fields into a readable string.
 *
 * @example
 * formatPackaging({ cones_per_box: 12, box_count: 3, box_no: 'A1' })
 * // => '12 côn/thùng | 3 Thùng | Box #A1'
 */
export function formatPackaging(item: Record<string, unknown>): string {
  const parts: string[] = [];

  const cones = Number(item.cones_per_box);
  if (!Number.isNaN(cones) && cones > 0) {
    parts.push(`${cones} ${PACKAGING_LABELS.conesUnit}`);
  }

  const boxCount = Number(item.box_count);
  if (!Number.isNaN(boxCount) && boxCount > 0) {
    parts.push(`${boxCount} ${PACKAGING_LABELS.boxLabel}`);
  }

  const boxNo = String(item.box_no ?? '');
  if (boxNo) {
    parts.push(`Box #${boxNo}`);
  }

  return parts.length > 0 ? parts.join(' | ') : '—';
}
