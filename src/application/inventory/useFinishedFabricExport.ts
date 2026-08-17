import { useCallback } from 'react';

import { fetchFinishedFabricAll } from '@/api/finished-fabric.api';
import { exportToExcel, exportToPdf } from '@/shared/utils/export';
import type { ExportColumn } from '@/shared/utils/export';
import { QUALITY_GRADE_LABELS, ROLL_STATUS_LABELS } from '@/schema/roll.schema';
import type { FinishedFabricRoll } from '@/domain/inventory/finished-fabric.types';
import type { FinishedFabricFilter } from '@/domain/inventory/finished-fabric.types';

const EXPORT_COLUMNS: ExportColumn[] = [
  {
    key: 'roll_number',
    label: 'Mã cuộn',
    width: 18,
  },
  {
    key: 'fabric_type',
    label: 'Loại vải',
    width: 22,
  },
  {
    key: 'color_name',
    label: 'Màu vải',
    width: 16,
  },
  {
    key: 'quality_grade',
    label: 'Chất lượng',
    width: 12,
    align: 'center',
  },
  {
    key: 'width_cm',
    label: 'Khổ (cm)',
    width: 10,
    align: 'right',
  },
  {
    key: 'length_m',
    label: 'Dài (m)',
    width: 10,
    align: 'right',
  },
  {
    key: 'weight_kg',
    label: 'Trọng lượng (kg)',
    width: 16,
    align: 'right',
  },
  {
    key: 'status',
    label: 'Trạng thái',
    width: 16,
  },
  {
    key: 'warehouse_location',
    label: 'Vị trí kho',
    width: 14,
  },
  {
    key: 'production_date',
    label: 'Ngày hoàn thành',
    width: 16,
    align: 'center',
  },
  {
    key: 'notes',
    label: 'Ghi chú',
    width: 24,
  },
];

type RollExportRow = Record<string, string | number>;

function toExportRows(rolls: FinishedFabricRoll[]): RollExportRow[] {
  return rolls.map((roll) => ({
    roll_number: roll.roll_number,
    fabric_type: roll.fabric_type,
    color_name: roll.color_name ?? '',
    quality_grade: roll.quality_grade
      ? QUALITY_GRADE_LABELS[
          roll.quality_grade as keyof typeof QUALITY_GRADE_LABELS
        ] || roll.quality_grade
      : '',
    width_cm: roll.width_cm ?? '',
    length_m: roll.length_m ?? '',
    weight_kg: roll.weight_kg ?? '',
    status: ROLL_STATUS_LABELS[roll.status],
    warehouse_location: roll.warehouse_location ?? '',
    production_date: roll.production_date ?? '',
    notes: roll.notes ?? '',
  }));
}

function makeFileName(prefix: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${prefix}_${date}_${time}`;
}

export function useFinishedFabricExport() {
  /** Export toàn bộ data theo filter hiện tại (dùng ở list page) */
  const exportExcel = useCallback(
    async (
      filters: FinishedFabricFilter = {},
      filePrefix = 'vai_thanh_pham',
    ) => {
      const rolls = await fetchFinishedFabricAll(filters);
      await exportToExcel(toExportRows(rolls), EXPORT_COLUMNS, {
        fileName: makeFileName(filePrefix),
        sheetName: 'Cuộn vải thành phẩm',
      });
    },
    [],
  );

  /** Export từ array có sẵn (dùng sau khi bulk save thành công) */
  const exportRollsExcel = useCallback(
    async (
      rolls: FinishedFabricRoll[],
      filePrefix = 'bien_ban_nhap_kho_tp',
    ) => {
      await exportToExcel(toExportRows(rolls), EXPORT_COLUMNS, {
        fileName: makeFileName(filePrefix),
        sheetName: 'Cuộn vải thành phẩm',
      });
    },
    [],
  );

  const exportPdf = useCallback(
    async (
      filters: FinishedFabricFilter = {},
      filePrefix = 'vai_thanh_pham',
    ) => {
      const rolls = await fetchFinishedFabricAll(filters);
      exportToPdf(toExportRows(rolls), EXPORT_COLUMNS, {
        fileName: makeFileName(filePrefix),
        title: 'Danh sách cuộn vải thành phẩm',
        subtitle: `Tổng: ${rolls.length} cuộn · ${rolls
          .reduce((sum, r) => sum + (r.weight_kg ?? 0), 0)
          .toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg`,
      });
    },
    [],
  );

  /** Export PDF từ array có sẵn (dùng sau khi bulk save thành công) */
  const exportRollsPdf = useCallback(
    (rolls: FinishedFabricRoll[], filePrefix = 'bien_ban_nhap_kho_tp') => {
      exportToPdf(toExportRows(rolls), EXPORT_COLUMNS, {
        fileName: makeFileName(filePrefix),
        title: 'Biên bản nhập kho thành phẩm',
        subtitle: `Tổng: ${rolls.length} cuộn · ${rolls
          .reduce((sum, r) => sum + (r.weight_kg ?? 0), 0)
          .toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg`,
      });
    },
    [],
  );

  return {
    exportExcel,
    exportRollsExcel,
    exportPdf,
    exportRollsPdf,
  };
}
