import type { ShipmentDocument } from '@/domain/shipments/types';

import { SHIPMENT_DOCUMENT_LABELS } from './shipment-document.constants';

export type ShipmentDocumentRow = {
  index: number;
  rollNumber: string;
  fabricType: string;
  colorName: string;
  quantityText: string;
  quantityValue: number;
  unit: string;
  note: string;
};

export type DocumentPage = {
  page: number;
  totalPages: number;
  groups: GroupedDocumentRow[];
  isLastPage: boolean;
  copyLabel?: string;
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
        unit: item.unit || 'm',
        note: formatText(item.notes),
      };
    });
}

export function groupShipmentItems(
  rawRows: ShipmentDocumentRow[],
): GroupedDocumentRow[] {
  const groups = new Map<string, GroupedDocumentRow>();

  rawRows.forEach((row) => {
    const key = `${row.fabricType}|${row.colorName}`;
    if (!groups.has(key)) {
      groups.set(key, {
        index: groups.size + 1,
        fabricType: row.fabricType,
        colorName: row.colorName,
        rolls: [],
        totalQuantityText: '',
        totalQuantityValue: 0,
        unit: row.unit,
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
    group.totalQuantityText = `${formatNumber(group.totalQuantityValue)} ${row.unit}`;
  });

  return Array.from(groups.values());
}

export function toGroupedDocumentRows(
  shipment: ShipmentDocument,
): GroupedDocumentRow[] {
  const rawRows = toShipmentDocumentRows(shipment);
  return groupShipmentItems(rawRows);
}

/**
 * Phân trang dựa trên số dòng in thực tế (print rows).
 * 1 group = 1 dòng header + số lượng cuộn (nếu muốn cuộn dàn nhiều dòng, hiện tại dàn ngang wrap nên đếm số lượng cuộn chia cho 4 để tính dòng).
 * Giả định: 1 dòng chứa được khoảng 4 roll-pills.
 */
export function paginateGroupedRows(
  groups: GroupedDocumentRow[],
  maxRowsPerPage: number = 14,
  reservedRowsLastPage: number = 4,
): DocumentPage[] {
  const pages: DocumentPage[] = [];
  let currentPageGroups: GroupedDocumentRow[] = [];
  let currentRowCount = 0;

  for (const group of groups) {
    const estimatedRollRows = Math.ceil(group.rolls.length / 4);
    // 1 row for header/info + roll rows
    const groupRows = 1 + estimatedRollRows;

    if (
      currentRowCount + groupRows > maxRowsPerPage &&
      currentPageGroups.length > 0
    ) {
      // Đẩy trang hiện tại vào mảng
      pages.push({
        page: pages.length + 1,
        totalPages: 0,
        groups: currentPageGroups,
        isLastPage: false,
      });
      currentPageGroups = [];
      currentRowCount = 0;
    }

    // Nếu group này quá to, vượt qua cả 1 trang (hiếm khi xảy ra nhưng có thể) -> Ở đây ta cứ nhét vào trang mới, CSS overflow ẩn đi phần lố (hoặc ta có thể split group - TBD).
    // Tạm thời để đơn giản và an toàn, ta nhét luôn vào trang hiện tại.
    currentPageGroups.push({ ...group });
    currentRowCount += groupRows;
  }

  if (currentPageGroups.length > 0) {
    pages.push({
      page: pages.length + 1,
      totalPages: 0,
      groups: currentPageGroups,
      isLastPage: false,
    });
  }

  // Check reserve space for last page
  if (pages.length > 0) {
    const lastPage = pages[pages.length - 1];
    if (lastPage) {
      let lastPageRows = 0;
      for (const g of lastPage.groups) {
        lastPageRows += 1 + Math.ceil(g.rolls.length / 4);
      }

      if (lastPageRows + reservedRowsLastPage > maxRowsPerPage) {
        // Không đủ chỗ cho chữ ký, tạo trang mới chỉ chứa chữ ký
        pages.push({
          page: pages.length + 1,
          totalPages: 0,
          groups: [],
          isLastPage: true,
        });
      }
    }
  } else {
    // Empty state
    pages.push({
      page: 1,
      totalPages: 1,
      groups: [],
      isLastPage: true,
    });
  }

  // Set totalPages and isLastPage
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    p.totalPages = totalPages;
    p.isLastPage = idx === totalPages - 1;
  });

  return pages;
}
