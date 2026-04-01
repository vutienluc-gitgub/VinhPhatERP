import dayjs from 'dayjs'
import { useCallback } from 'react'

import { exportToExcel, exportToPdf } from '@/shared/utils/export'
import type { ExportColumn } from '@/shared/utils/export'

import { QUALITY_GRADE_LABELS, ROLL_STATUS_LABELS } from './raw-fabric.module'
import type { RawFabricRoll } from './types'

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'lot_number',         label: 'Số lô',            width: 18 },
  { key: 'roll_number',        label: 'Mã cuộn',         width: 18 },
  { key: 'barcode',            label: 'Mã vạch',         width: 20 },
  { key: 'fabric_type',        label: 'Loại vải',         width: 22 },
  { key: 'color_name',         label: 'Màu vải',          width: 16 },
  { key: 'quality_grade',      label: 'Chất lượng',       width: 12, align: 'center' },
  { key: 'width_cm',           label: 'Khổ (cm)',         width: 10, align: 'right' },
  { key: 'length_m',           label: 'Dài (m)',          width: 10, align: 'right' },
  { key: 'weight_kg',          label: 'Trọng lượng (kg)', width: 16, align: 'right' },
  { key: 'status',             label: 'Trạng thái',       width: 16 },
  { key: 'warehouse_location', label: 'Vị trí kho',       width: 14 },
  { key: 'production_date',    label: 'Ngày dệt',         width: 12, align: 'center' },
  { key: 'notes',              label: 'Ghi chú',          width: 24 },
]

type RollExportRow = Record<string, string | number>

function toExportRows(rolls: RawFabricRoll[]): RollExportRow[] {
  return rolls.map((roll) => ({
    lot_number:         roll.lot_number ?? '',
    roll_number:        roll.roll_number,
    barcode:            roll.barcode ?? '',
    fabric_type:        roll.fabric_type,
    color_name:         roll.color_name ?? '',
    quality_grade:      roll.quality_grade ? QUALITY_GRADE_LABELS[roll.quality_grade] : '',
    width_cm:           roll.width_cm ?? '',
    length_m:           roll.length_m ?? '',
    weight_kg:          roll.weight_kg ?? '',
    status:             ROLL_STATUS_LABELS[roll.status],
    warehouse_location: roll.warehouse_location ?? '',
    production_date:    roll.production_date ?? '',
    notes:              roll.notes ?? '',
  }))
}

function makeFileName(prefix: string): string {
  return `${prefix}_${dayjs().format('YYYYMMDD_HHmm')}`
}

export function useRawFabricExport() {
  const exportExcel = useCallback(async (rolls: RawFabricRoll[], filePrefix = 'vai_moc') => {
    await exportToExcel(toExportRows(rolls), EXPORT_COLUMNS, {
      fileName: makeFileName(filePrefix),
      sheetName: 'Cuộn vải mộc',
    })
  }, [])

  const exportPdf = useCallback((rolls: RawFabricRoll[], filePrefix = 'vai_moc') => {
    exportToPdf(toExportRows(rolls), EXPORT_COLUMNS, {
      fileName: makeFileName(filePrefix),
      title: 'Danh sách cuộn vải mộc',
      subtitle: `Tổng: ${rolls.length} cuộn · ${rolls
        .reduce((sum, r) => sum + (r.weight_kg ?? 0), 0)
        .toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg`,
    })
  }, [])

  return { exportExcel, exportPdf }
}
