import dayjs from 'dayjs'
import { useCallback } from 'react'

import { exportToExcel, exportToPdf } from '@/shared/utils/export'
import type { ExportColumn } from '@/shared/utils/export'

import { QUALITY_GRADE_LABELS, ROLL_STATUS_LABELS } from './finished-fabric.module'
import type { FinishedFabricRoll } from './types'

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'roll_number',        label: 'Mã cuộn',          width: 18 },
  { key: 'fabric_type',        label: 'Loại vải',          width: 22 },
  { key: 'color_name',         label: 'Màu vải',           width: 16 },
  { key: 'quality_grade',      label: 'Chất lượng',        width: 12, align: 'center' },
  { key: 'width_cm',           label: 'Khổ (cm)',          width: 10, align: 'right' },
  { key: 'length_m',           label: 'Dài (m)',           width: 10, align: 'right' },
  { key: 'weight_kg',          label: 'Trọng lượng (kg)',  width: 16, align: 'right' },
  { key: 'status',             label: 'Trạng thái',        width: 16 },
  { key: 'warehouse_location', label: 'Vị trí kho',        width: 14 },
  { key: 'production_date',    label: 'Ngày hoàn thành',   width: 16, align: 'center' },
  { key: 'notes',              label: 'Ghi chú',           width: 24 },
]

type RollExportRow = Record<string, string | number>

function toExportRows(rolls: FinishedFabricRoll[]): RollExportRow[] {
  return rolls.map((roll) => ({
    roll_number:        roll.roll_number,
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

export function useFinishedFabricExport() {
  const exportExcel = useCallback(
    async (rolls: FinishedFabricRoll[], filePrefix = 'vai_thanh_pham') => {
      await exportToExcel(toExportRows(rolls), EXPORT_COLUMNS, {
        fileName: makeFileName(filePrefix),
        sheetName: 'Cuộn vải thành phẩm',
      })
    },
    [],
  )

  const exportPdf = useCallback(
    (rolls: FinishedFabricRoll[], filePrefix = 'vai_thanh_pham') => {
      exportToPdf(toExportRows(rolls), EXPORT_COLUMNS, {
        fileName: makeFileName(filePrefix),
        title: 'Danh sách cuộn vải thành phẩm',
        subtitle: `Tổng: ${rolls.length} cuộn · ${rolls
          .reduce((sum, r) => sum + (r.weight_kg ?? 0), 0)
          .toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg`,
      })
    },
    [],
  )

  return { exportExcel, exportPdf }
}
