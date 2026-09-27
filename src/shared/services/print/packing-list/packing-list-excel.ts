import {
  PACKING_LIST_EXPORT_COLUMNS,
  formatPackingListForExcel,
} from '@/domain/inventory/packing-export.utils';
import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { exportToExcel } from '@/shared/utils/export';

export interface PackingListExcelOptions {
  /** Overrides the generated file name (without extension). */
  fileName?: string;
  /** Human title used to derive the file name when `fileName` is omitted. */
  title?: string;
  sheetName?: string;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function makeFileName(title?: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const base = title ? slugify(title) : 'bang_ke_cay_vai';
  return `${base || 'bang_ke_cay_vai'}_${stamp}`;
}

/** Exports packing-list rolls to a real Excel (.xlsx) workbook. */
export async function exportPackingListToExcel(
  rolls: FabricRollPackingItem[],
  options: PackingListExcelOptions = {},
): Promise<void> {
  const rows = formatPackingListForExcel(rolls).map(
    (row) => ({ ...row }) as Record<string, unknown>,
  );

  await exportToExcel(rows, PACKING_LIST_EXPORT_COLUMNS, {
    fileName: options.fileName ?? makeFileName(options.title),
    sheetName: options.sheetName ?? 'Bảng kê cây vải',
  });
}
