import type { ShipmentDocument } from './types';
import { SHIPMENT_DOCUMENT_LABELS } from './shipment-document.constants';

export type ShipmentDocumentRow = {
  index: number;
  rollNumber: string;
  fabricType: string;
  colorName: string;
  quantityText: string;
  quantityValue: number;
  note: string;
};

export type GroupedDocumentRow = {
  index: number;
  fabricType: string;
  colorName: string;
  rolls: Array<{ number: string; quantityText: string }>;
  totalQuantityText: string;
  totalQuantityValue: number;
  unit: string;
  note: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : SHIPMENT_DOCUMENT_LABELS.EMPTY_VALUE;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return SHIPMENT_DOCUMENT_LABELS.EMPTY_VALUE;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('vi-VN');
}

export function formatDateTime(value: Date): string {
  return value.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return SHIPMENT_DOCUMENT_LABELS.EMPTY_VALUE;

  return value.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function makeShipmentDocumentFileName(
  shipment: Pick<ShipmentDocument, 'shipment_number' | 'shipment_date'>,
): string {
  const safeNumber = shipment.shipment_number
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
  const safeDate =
    shipment.shipment_date.replace(/[^0-9-]/g, '') ||
    new Date().toISOString().slice(0, 10);
  return `phieu_xuat_${safeNumber}_${safeDate}.pdf`;
}

export function toShipmentDocumentRows(
  shipment: ShipmentDocument,
): ShipmentDocumentRow[] {
  return (shipment.shipment_items ?? [])
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item, index) => {
      const quantityValue = Number(item.quantity ?? 0);
      const rollLength =
        item.roll_length_m === null || item.roll_length_m === undefined
          ? null
          : Number(item.roll_length_m);
      const rollMeta =
        rollLength && !Number.isNaN(rollLength)
          ? ` (${formatNumber(rollLength)}m)`
          : '';

      return {
        index: index + 1,
        rollNumber: item.roll_number
          ? `${item.roll_number}${rollMeta}`
          : SHIPMENT_DOCUMENT_LABELS.EMPTY_VALUE,
        fabricType: formatText(item.fabric_type),
        colorName: formatText(item.color_name),
        quantityText: `${formatNumber(quantityValue)} ${item.unit || 'm'}`,
        quantityValue,
        note: formatText(item.notes),
      };
    });
}

export function toGroupedDocumentRows(
  shipment: ShipmentDocument,
): GroupedDocumentRow[] {
  const rawRows = toShipmentDocumentRows(shipment);
  const groups = new Map<string, GroupedDocumentRow>();

  rawRows.forEach((row, idx) => {
    const unit = shipment.shipment_items?.[idx]?.unit ?? 'm';
    const key = `${row.fabricType}|${row.colorName}`;
    if (!groups.has(key)) {
      groups.set(key, {
        index: groups.size + 1,
        fabricType: row.fabricType,
        colorName: row.colorName,
        rolls: [],
        totalQuantityText: '',
        totalQuantityValue: 0,
        unit,
        note:
          row.note !== SHIPMENT_DOCUMENT_LABELS.EMPTY_VALUE
            ? row.note
            : SHIPMENT_DOCUMENT_LABELS.EMPTY_VALUE,
      });
    }
    const group = groups.get(key)!;
    group.rolls.push({
      number: row.rollNumber,
      quantityText: row.quantityText,
    });
    group.totalQuantityValue += row.quantityValue;
    group.totalQuantityText = `${formatNumber(group.totalQuantityValue)} ${unit}`;
  });

  return Array.from(groups.values());
}
