import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  bulkFinishedInputDefaults,
  bulkFinishedInputSchema,
  formatBulkRollNumber,
} from './finished-fabric.module'
import type { BulkFinishedInputFormValues } from './finished-fabric.module'
import type { FinishedFabricRoll } from './types'
import {
  useCreateFinishedFabricBulk,
  useRawRollsByLot,
} from './useFinishedFabric'
import { useFinishedFabricExport } from './useFinishedFabricExport'

type Props = {
  onClose: () => void
}

/* ---- Excel/CSV import helpers ---- */

const HEADER_ALIASES: Record<string, string> = {
  'mã cuộn': 'roll_number',
  'ma cuon': 'roll_number',
  'roll_number': 'roll_number',
  'cuộn mộc': 'raw_roll_number',
  'cuon moc': 'raw_roll_number',
  'raw_roll_number': 'raw_roll_number',
  'raw_roll': 'raw_roll_number',
  'cân': 'weight_kg',
  'can': 'weight_kg',
  'trọng lượng': 'weight_kg',
  'trong luong': 'weight_kg',
  'weight_kg': 'weight_kg',
  'weight': 'weight_kg',
  'dài': 'length_m',
  'dai': 'length_m',
  'length_m': 'length_m',
  'length': 'length_m',
  'cl': 'quality_grade',
  'chất lượng': 'quality_grade',
  'chat luong': 'quality_grade',
  'quality_grade': 'quality_grade',
  'ghi chú': 'notes',
  'ghi chu': 'notes',
  'notes': 'notes',
}

function normalizeHeader(raw: string): string {
  const key = raw.trim().toLowerCase()
  return HEADER_ALIASES[key] ?? key
}

type ParsedRow = {
  roll_number?: string
  raw_roll_number?: string
  weight_kg?: number
  length_m?: number
  quality_grade?: string
  notes?: string
}

async function parseExcelFile(file: File): Promise<ParsedRow[]> {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  if (!ws || ws.rowCount < 2) return []

  const headerRow = ws.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = normalizeHeader(String(cell.value ?? ''))
  })

  const rows: ParsedRow[] = []
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i)
    const obj: Record<string, unknown> = {}
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const h = headers[colNumber]
      if (h) obj[h] = cell.value
    })
    if (!obj.roll_number && !obj.weight_kg) continue
    rows.push({
      roll_number: obj.roll_number != null ? String(obj.roll_number).trim() : undefined,
      raw_roll_number: obj.raw_roll_number != null ? String(obj.raw_roll_number).trim() : undefined,
      weight_kg: obj.weight_kg != null ? Number(obj.weight_kg) : undefined,
      length_m: obj.length_m != null ? Number(obj.length_m) : undefined,
      quality_grade: obj.quality_grade != null ? String(obj.quality_grade).trim().toUpperCase() : undefined,
      notes: obj.notes != null ? String(obj.notes).trim() : undefined,
    })
  }
  return rows
}

function parseCsvText(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0]!.split(',').map(normalizeHeader)
  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',')
    const obj: Record<string, string> = {}
    cells.forEach((c, idx) => {
      if (headers[idx]) obj[headers[idx]] = c.trim()
    })
    if (!obj.roll_number && !obj.weight_kg) continue
    rows.push({
      roll_number: obj.roll_number || undefined,
      raw_roll_number: obj.raw_roll_number || undefined,
      weight_kg: obj.weight_kg ? Number(obj.weight_kg) : undefined,
      length_m: obj.length_m ? Number(obj.length_m) : undefined,
      quality_grade: obj.quality_grade?.toUpperCase() || undefined,
      notes: obj.notes || undefined,
    })
  }
  return rows
}

export function FinishedFabricBulkForm({ onClose }: Props) {
  const bulkMutation = useCreateFinishedFabricBulk()
  const weightRefs = useRef<(HTMLInputElement | null)[]>([])
  const [savedRolls, setSavedRolls] = useState<FinishedFabricRoll[] | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const { exportExcel, exportPdf } = useFinishedFabricExport()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BulkFinishedInputFormValues>({
    resolver: zodResolver(bulkFinishedInputSchema),
    defaultValues: bulkFinishedInputDefaults,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'rolls' })

  const rollPrefix = useWatch({ control, name: 'roll_prefix' })
  const startNumber = useWatch({ control, name: 'start_number' })
  const rolls = useWatch({ control, name: 'rolls' })
  const lotNumber = useWatch({ control, name: 'lot_number' })

  // Lấy danh sách cuộn mộc theo lot_number đã nhập
  const { data: rawRollsForLot = [] } = useRawRollsByLot(lotNumber ?? '')

  // Auto-generate roll numbers khi prefix hoặc start_number thay đổi
  useEffect(() => {
    const prefix = rollPrefix?.trim() || bulkFinishedInputDefaults.roll_prefix
    const start = typeof startNumber === 'number' ? startNumber : bulkFinishedInputDefaults.start_number
    fields.forEach((_, idx) => {
      setValue(`rolls.${idx}.roll_number`, formatBulkRollNumber(prefix, start + idx))
    })
  }, [rollPrefix, startNumber, fields.length, setValue, fields])

  const addRow = useCallback(() => {
    const prefix = rollPrefix?.trim() || bulkFinishedInputDefaults.roll_prefix
    const start = typeof startNumber === 'number' ? startNumber : bulkFinishedInputDefaults.start_number
    append({
      roll_number: formatBulkRollNumber(prefix, start + fields.length),
      raw_roll_id: '' as unknown as string,
      weight_kg: undefined as unknown as number,
      length_m: undefined,
      quality_grade: undefined,
      notes: '',
    })
    requestAnimationFrame(() => weightRefs.current[fields.length]?.focus())
  }, [append, rollPrefix, startNumber, fields.length])

  function addMultipleRows(count: number) {
    const prefix = rollPrefix?.trim() || bulkFinishedInputDefaults.roll_prefix
    const start = typeof startNumber === 'number' ? startNumber : bulkFinishedInputDefaults.start_number
    const newRows = Array.from({ length: count }, (_, i) => ({
      roll_number: formatBulkRollNumber(prefix, start + fields.length + i),
      raw_roll_id: '' as unknown as string,
      weight_kg: undefined as unknown as number,
      length_m: undefined,
      quality_grade: undefined,
      notes: '',
    }))
    append(newRows)
  }

  // Tổng hợp — chỉ đếm dòng có nhập trọng lượng > 0
  const filledRolls = (rolls ?? []).filter((r) => {
    const val = parseFloat(String(r.weight_kg))
    return Number.isFinite(val) && val > 0
  })
  const totalRolls = filledRolls.length
  const totalWeight = filledRolls.reduce((sum, r) => sum + parseFloat(String(r.weight_kg)), 0)

  async function onSubmit(values: BulkFinishedInputFormValues) {
    const saved = await bulkMutation.mutateAsync(values)
    setSavedRolls(saved)
  }

  // Nhập số nguyên → tự động thêm dấu thập phân: 211 → 21.1
  const handleWeightBlur = useCallback(
    (
      e: React.FocusEvent<HTMLInputElement>,
      idx: number,
      rhfOnBlur: React.FocusEventHandler<HTMLInputElement>,
    ) => {
      const raw = e.target.value.trim()
      if (raw !== '' && /^\d+$/.test(raw)) {
        const transformed = parseInt(raw, 10) / 10
        e.target.value = String(transformed)
        setValue(`rolls.${idx}.weight_kg`, transformed as unknown as number, { shouldValidate: false })
      }
      rhfOnBlur(e)
    },
    [setValue],
  )

  // Nhấn Enter trong ô trọng lượng → focus dòng tiếp theo hoặc thêm dòng mới
  function handleWeightKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (index < fields.length - 1) {
      requestAnimationFrame(() => weightRefs.current[index + 1]?.focus())
    } else if (e.currentTarget.value.trim()) {
      addRow()
    }
  }

  // ---- Import Excel/CSV ----
  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)

    try {
      let parsed: ParsedRow[]
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        parsed = parseCsvText(text)
      } else {
        parsed = await parseExcelFile(file)
      }

      if (parsed.length === 0) {
        setImportError('File không có dữ liệu hoặc không đúng định dạng.')
        return
      }

      // Resolve raw_roll_number → raw_roll_id nếu có
      const rawMap = new Map(rawRollsForLot.map((r) => [r.roll_number, r.id]))

      const newRows = parsed.map((row, i) => {
        const prefix = rollPrefix?.trim() || bulkFinishedInputDefaults.roll_prefix
        const start = typeof startNumber === 'number' ? startNumber : bulkFinishedInputDefaults.start_number
        const rollNum = row.roll_number || formatBulkRollNumber(prefix, start + i)

        let rawId = '' as string
        if (row.raw_roll_number) {
          rawId = rawMap.get(row.raw_roll_number) ?? ''
        }

        return {
          roll_number: rollNum,
          raw_roll_id: rawId as unknown as string,
          weight_kg: (row.weight_kg ?? undefined) as unknown as number,
          length_m: row.length_m,
          quality_grade: (['A', 'B', 'C'].includes(row.quality_grade ?? '') ? row.quality_grade : undefined) as 'A' | 'B' | 'C' | undefined,
          notes: row.notes ?? '',
        }
      })

      // Replace all rows
      // Remove existing, then append new
      for (let i = fields.length - 1; i >= 0; i--) {
        remove(i)
      }
      append(newRows)

      const unresolved = parsed.filter((r) => r.raw_roll_number && !rawMap.get(r.raw_roll_number))
      if (unresolved.length > 0) {
        setImportError(
          `${parsed.length} dòng đã nhập. ${unresolved.length} cuộn mộc không tìm thấy trong lô "${lotNumber}": ${unresolved
            .map((r) => r.raw_roll_number)
            .join(', ')}. Vui lòng chọn lại cuộn mộc cho các dòng này.`,
        )
      }
    } catch (err) {
      setImportError(`Lỗi đọc file: ${(err as Error).message}`)
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isPending = isSubmitting || bulkMutation.isPending

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet bulk-sheet" role="dialog" aria-modal="true" aria-labelledby="bulk-title">
        <div className="modal-header">
          <h3 id="bulk-title">Nhập hàng loạt cuộn vải thành phẩm</h3>
          <button className="btn-icon" type="button" onClick={onClose} aria-label="Đóng" style={{ fontSize: '1.1rem' }}>
            ✕
          </button>
        </div>

        {/* ===== SUCCESS STATE ===== */}
        {savedRolls !== null ? (
          <div className="bulk-success">
            <div className="bulk-success-icon">✓</div>
            <p className="bulk-success-title">Nhập kho thành công</p>
            <p className="bulk-success-sub">
              Đã lưu <strong>{savedRolls.length} cuộn</strong> ·{' '}
              <strong>
                {savedRolls
                  .reduce((sum, r) => sum + (r.weight_kg ?? 0), 0)
                  .toLocaleString('vi-VN', { maximumFractionDigits: 2 })}{' '}
                kg
              </strong>
            </p>
            <p className="bulk-success-hint">Tùy chọn: xuất danh sách vừa nhập ra file</p>
            <div className="bulk-success-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => exportExcel(savedRolls, 'bien_ban_nhap_kho_tp')}
              >
                📊 Xuất Excel
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => exportPdf(savedRolls, 'bien_ban_nhap_kho_tp')}
              >
                🖨 Xuất PDF
              </button>
              <button className="primary-button" type="button" onClick={onClose} style={{ minHeight: 40 }}>
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <>
            {bulkMutation.error && (
              <p style={{ color: '#c0392b', fontSize: '0.88rem', marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
                Lỗi: {(bulkMutation.error as Error).message}
              </p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* ===== THÔNG TIN LÔ + CHUNG ===== */}
              <fieldset className="bulk-section">
                <legend>Thông tin lô & chung (áp dụng cho tất cả cuộn)</legend>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="bulk_lot_number">
                      Số lô (Lot number) <span className="field-required">*</span>
                    </label>
                    <input
                      id="bulk_lot_number"
                      className={`field-input${errors.lot_number ? ' is-error' : ''}`}
                      type="text"
                      placeholder="VD: LOT-2026-001"
                      {...register('lot_number')}
                    />
                    {errors.lot_number && <span className="field-error">{errors.lot_number.message}</span>}
                    <span className="field-hint" style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
                      Bắt buộc. Hệ thống sẽ đối chiếu với lô cuộn mộc nguồn.
                      {rawRollsForLot.length > 0 && (
                        <strong> — Tìm thấy {rawRollsForLot.length} cuộn mộc trong lô này.</strong>
                      )}
                    </span>
                  </div>

                  <div className="form-field">
                    <label htmlFor="bulk_fabric_type">
                      Loại vải <span className="field-required">*</span>
                    </label>
                    <input
                      id="bulk_fabric_type"
                      className={`field-input${errors.fabric_type ? ' is-error' : ''}`}
                      type="text"
                      placeholder="VD: Dệt thoi 60/40 TC"
                      {...register('fabric_type')}
                    />
                    {errors.fabric_type && <span className="field-error">{errors.fabric_type.message}</span>}
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="bulk_color_name">Màu vải</label>
                    <input id="bulk_color_name" className="field-input" type="text" placeholder="VD: Trắng ngà" {...register('color_name')} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="bulk_color_code">Mã màu</label>
                    <input id="bulk_color_code" className="field-input" type="text" placeholder="VD: TC-01" {...register('color_code')} />
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="bulk_width_cm">Khổ vải (cm)</label>
                    <input
                      id="bulk_width_cm"
                      className={`field-input${errors.width_cm ? ' is-error' : ''}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="VD: 150"
                      {...register('width_cm')}
                    />
                    {errors.width_cm && <span className="field-error">{errors.width_cm.message}</span>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="bulk_quality_grade">Chất lượng mặc định</label>
                    <select id="bulk_quality_grade" className="field-select" {...register('quality_grade')}>
                      <option value="">Chưa kiểm định</option>
                      {QUALITY_GRADES.map((g) => (
                        <option key={g} value={g}>{QUALITY_GRADE_LABELS[g]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="bulk_status">Trạng thái</label>
                    <select id="bulk_status" className="field-select" {...register('status')}>
                      {ROLL_STATUSES.map((s) => (
                        <option key={s} value={s}>{ROLL_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="bulk_production_date">Ngày hoàn thành</label>
                    <input id="bulk_production_date" className="field-input" type="date" {...register('production_date')} />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="bulk_warehouse_location">Vị trí kho</label>
                  <input
                    id="bulk_warehouse_location"
                    className="field-input"
                    type="text"
                    placeholder="VD: B2-R1-S4"
                    {...register('warehouse_location')}
                  />
                </div>
              </fieldset>

              {/* ===== CẤU HÌNH MÃ CUỘN ===== */}
              <fieldset className="bulk-section">
                <legend>Cấu hình mã cuộn tự động</legend>
                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="bulk_roll_prefix">
                      Tiền tố mã cuộn <span className="field-required">*</span>
                    </label>
                    <input
                      id="bulk_roll_prefix"
                      className={`field-input${errors.roll_prefix ? ' is-error' : ''}`}
                      type="text"
                      placeholder="VD: FN-"
                      {...register('roll_prefix')}
                    />
                    {errors.roll_prefix && <span className="field-error">{errors.roll_prefix.message}</span>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="bulk_start_number">Số bắt đầu</label>
                    <input
                      id="bulk_start_number"
                      className={`field-input${errors.start_number ? ' is-error' : ''}`}
                      type="number"
                      min="1"
                      step="1"
                      {...register('start_number')}
                    />
                    {errors.start_number && <span className="field-error">{errors.start_number.message}</span>}
                  </div>
                </div>
              </fieldset>

              {/* ===== IMPORT FILE ===== */}
              <fieldset className="bulk-section">
                <legend>Import từ Excel / CSV</legend>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileImport}
                    style={{ fontSize: '0.88rem' }}
                  />
                  <span className="bulk-hint">
                    Header: Mã cuộn, Cuộn mộc, Cân, Dài, CL, Ghi chú.
                    {lotNumber && rawRollsForLot.length === 0 && (
                      <strong style={{ color: '#c0392b' }}> Chưa tìm thấy cuộn mộc nào trong lô "{lotNumber}" — hãy kiểm tra lại số lô.</strong>
                    )}
                  </span>
                </div>
                {importError && (
                  <p style={{ color: '#c07020', fontSize: '0.85rem', marginTop: '0.5rem' }}>{importError}</p>
                )}
              </fieldset>

              {/* ===== BẢNG NHẬP CUỘN ===== */}
              <fieldset className="bulk-section">
                <legend>
                  Danh sách cuộn
                  <span className="bulk-summary">
                    {totalRolls} cuộn · {totalWeight.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg
                  </span>
                </legend>

                <div className="bulk-table-wrap">
                  <table className="bulk-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Mã cuộn</th>
                        <th>Cuộn mộc nguồn <span className="field-required">*</span></th>
                        <th>Trọng lượng (kg) <span className="field-required">*</span></th>
                        <th>Dài (m)</th>
                        <th>CL</th>
                        <th>Ghi chú</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, idx) => (
                        <tr key={field.id}>
                          <td className="td-muted">{idx + 1}</td>
                          <td>
                            <input
                              className={`field-input bulk-input${errors.rolls?.[idx]?.roll_number ? ' is-error' : ''}`}
                              type="text"
                              readOnly
                              title="Mã cuộn được tạo theo tiền tố và số bắt đầu"
                              {...register(`rolls.${idx}.roll_number`)}
                            />
                            {errors.rolls?.[idx]?.roll_number && (
                              <span className="field-error">{errors.rolls[idx]?.roll_number?.message}</span>
                            )}
                          </td>
                          <td>
                            <select
                              className={`field-select bulk-input${errors.rolls?.[idx]?.raw_roll_id ? ' is-error' : ''}`}
                              {...register(`rolls.${idx}.raw_roll_id`)}
                            >
                              <option value="">— Chọn —</option>
                              {rawRollsForLot.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.roll_number}
                                </option>
                              ))}
                            </select>
                            {errors.rolls?.[idx]?.raw_roll_id && (
                              <span className="field-error">{errors.rolls[idx]?.raw_roll_id?.message}</span>
                            )}
                          </td>
                          <td>
                            {(() => {
                              const weightField = register(`rolls.${idx}.weight_kg`)
                              return (
                                <input
                                  className={`field-input bulk-input${errors.rolls?.[idx]?.weight_kg ? ' is-error' : ''}`}
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.0"
                                  {...weightField}
                                  onBlur={(e) => handleWeightBlur(e, idx, weightField.onBlur)}
                                  onKeyDown={(event) => handleWeightKeyDown(event, idx)}
                                  ref={(element) => {
                                    weightField.ref(element)
                                    weightRefs.current[idx] = element
                                  }}
                                />
                              )
                            })()}
                            {errors.rolls?.[idx]?.weight_kg && (
                              <span className="field-error">{errors.rolls[idx]?.weight_kg?.message}</span>
                            )}
                          </td>
                          <td>
                            <input
                              className="field-input bulk-input"
                              type="number"
                              step="0.001"
                              min="0"
                              placeholder="—"
                              {...register(`rolls.${idx}.length_m`)}
                            />
                          </td>
                          <td>
                            <select className="field-select bulk-input" {...register(`rolls.${idx}.quality_grade`)}>
                              <option value="">—</option>
                              {QUALITY_GRADES.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              className="field-input bulk-input"
                              type="text"
                              placeholder="—"
                              {...register(`rolls.${idx}.notes`)}
                            />
                          </td>
                          <td>
                            {fields.length > 1 && (
                              <button
                                className="btn-icon danger"
                                type="button"
                                title="Xóa dòng"
                                onClick={() => remove(idx)}
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {errors.rolls?.message && (
                  <span className="field-error" style={{ marginTop: '0.5rem', display: 'block' }}>
                    {errors.rolls.message}
                  </span>
                )}

                <div className="bulk-add-actions">
                  <button className="btn-secondary" type="button" onClick={addRow}>
                    + Thêm 1 cuộn
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => addMultipleRows(5)}>
                    + Thêm 5 cuộn
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => addMultipleRows(10)}>
                    + Thêm 10 cuộn
                  </button>
                  <span className="bulk-hint">Nhấn Enter trong ô trọng lượng để thêm dòng mới</span>
                </div>
              </fieldset>

              {/* ===== ACTIONS ===== */}
              <div className="modal-actions">
                <button className="btn-secondary" type="button" onClick={onClose} disabled={isPending}>
                  Hủy
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isPending}
                  style={{ minHeight: 40, padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
                >
                  {isPending
                    ? 'Đang lưu...'
                    : `Nhập kho ${totalRolls} cuộn (${totalWeight.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg)`}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
