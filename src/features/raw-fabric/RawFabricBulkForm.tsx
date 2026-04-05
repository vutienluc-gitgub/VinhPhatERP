import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet'

import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  bulkInputDefaults,
  bulkInputSchema,
  formatBulkRollNumber,
} from './raw-fabric.module'
import type { BulkInputFormValues } from './raw-fabric.module'
import {
  useCreateRawFabricBulk,
  useWeavingPartners,
  useWorkOrderOptions,
  useYarnReceiptOptions,
} from './useRawFabric'
import { useRawFabricExport } from './useRawFabricExport'
import type { RawFabricRoll } from './types'

type Props = {
  onClose: () => void
}

export function RawFabricBulkForm({ onClose }: Props) {
  const bulkMutation = useCreateRawFabricBulk()
  const { data: weavingPartners = [] } = useWeavingPartners()
  const { data: yarnReceipts = [] } = useYarnReceiptOptions()
  const { data: workOrders = [] } = useWorkOrderOptions()
  const weightRefs = useRef<(HTMLInputElement | null)[]>([])
  const [savedRolls, setSavedRolls] = useState<RawFabricRoll[] | null>(null)
  const { exportExcel, exportPdf } = useRawFabricExport()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BulkInputFormValues>({
    resolver: zodResolver(bulkInputSchema),
    defaultValues: bulkInputDefaults,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'rolls' })

  const rollPrefix = useWatch({ control, name: 'roll_prefix' })
  const startNumber = useWatch({ control, name: 'start_number' })
  const rolls = useWatch({ control, name: 'rolls' })

  // Auto-generate roll numbers khi prefix hoặc start_number thay đổi
  useEffect(() => {
    const prefix = rollPrefix?.trim() || bulkInputDefaults.roll_prefix
    const start = typeof startNumber === 'number' ? startNumber : bulkInputDefaults.start_number
    fields.forEach((_, idx) => {
      setValue(`rolls.${idx}.roll_number`, formatBulkRollNumber(prefix, start + idx))
    })
  }, [rollPrefix, startNumber, fields.length, setValue, fields])

  const addRow = useCallback(() => {
    const prefix = rollPrefix?.trim() || bulkInputDefaults.roll_prefix
    const start = typeof startNumber === 'number' ? startNumber : bulkInputDefaults.start_number
    append({
      roll_number: formatBulkRollNumber(prefix, start + fields.length),
      weight_kg: undefined as unknown as number,
      length_m: undefined,
      quality_grade: undefined,
      notes: '',
    })
    // Focus trọng lượng dòng mới sau khi render
    requestAnimationFrame(() => weightRefs.current[fields.length]?.focus())
  }, [append, rollPrefix, startNumber, fields.length])

  function addMultipleRows(count: number) {
    const prefix = rollPrefix?.trim() || bulkInputDefaults.roll_prefix
    const start = typeof startNumber === 'number' ? startNumber : bulkInputDefaults.start_number
    const newRows = Array.from({ length: count }, (_, i) => ({
      roll_number: formatBulkRollNumber(prefix, start + fields.length + i),
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

  async function onSubmit(values: BulkInputFormValues) {
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
      // Còn dòng tiếp theo → focus xuống
      requestAnimationFrame(() => weightRefs.current[index + 1]?.focus())
    } else if (e.currentTarget.value.trim()) {
      // Dòng cuối có giá trị → thêm dòng mới
      addRow()
    }
  }

  const isPending = isSubmitting || bulkMutation.isPending

  return (
    <AdaptiveSheet open={true} onClose={onClose} title="Nhập nhanh hàng loạt cuộn vải mộc" maxWidth={900}>
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
              onClick={() => exportExcel(savedRolls, 'bien_ban_nhap_kho')}
            >
              📊 Xuất Excel
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => exportPdf(savedRolls, 'bien_ban_nhap_kho')}
            >
              🖨 Xuất PDF
            </button>
            <button className="primary-button btn-standard" type="button" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      ) : (
        <>
          {bulkMutation.error && (
            <p className="error-inline" style={{ marginBottom: '1rem' }}>
              Lỗi: {(bulkMutation.error as Error).message}
            </p>
          )}

          <form id="raw-fabric-bulk-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* ===== THÔNG TIN CHUNG ===== */}
            <fieldset className="bulk-section">
              <legend>Thông tin chung (áp dụng cho tất cả cuộn)</legend>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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

                <div className="form-field">
                  <label htmlFor="bulk_warehouse_location">Vị trí kho</label>
                  <input
                    id="bulk_warehouse_location"
                    className="field-input"
                    type="text"
                    placeholder="VD: A1-R3-S2"
                    {...register('warehouse_location')}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="bulk_color_name">Màu vải</label>
                  <input id="bulk_color_name" className="field-input" type="text" placeholder="VD: Trắng ngà" {...register('color_name')} />
                </div>
                <div className="form-field">
                  <label htmlFor="bulk_color_code">Mã màu</label>
                  <input id="bulk_color_code" className="field-input" type="text" placeholder="VD: TC-01" {...register('color_code')} />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="bulk_status">Trạng thái</label>
                  <select id="bulk_status" className="field-select" {...register('status')}>
                    {ROLL_STATUSES.map((s) => (
                      <option key={s} value={s}>{ROLL_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="bulk_production_date">Ngày dệt</label>
                  <input id="bulk_production_date" className="field-input" type="date" {...register('production_date')} />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="bulk_work_order_id">Lệnh sản xuất (Work Order)</label>
                  <select id="bulk_work_order_id" className="field-select" {...register('work_order_id')}>
                    <option value="">— Không liên kết lệnh (Dự trữ) —</option>
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.work_order_number} ({wo.bom_template?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="bulk_weaving_partner_id">Nhà dệt gia công</label>
                  <select id="bulk_weaving_partner_id" className="field-select" {...register('weaving_partner_id')}>
                    <option value="">— Chọn nhà dệt —</option>
                    {weavingPartners.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="bulk_yarn_receipt_id">Phiếu nhập sợi nguồn</label>
                  <select id="bulk_yarn_receipt_id" className="field-select" {...register('yarn_receipt_id')}>
                    <option value="">— Chọn phiếu sợi —</option>
                    {yarnReceipts.map((r) => (
                      <option key={r.id} value={r.id}>{r.receipt_number} ({r.receipt_date})</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="bulk_lot_number">Số lô (Lot number)</label>
                  <input
                    id="bulk_lot_number"
                    className="field-input"
                    type="text"
                    placeholder="VD: LOT-2026-001"
                    {...register('lot_number')}
                  />
                  <span className="field-hint" style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
                    Áp dụng cho tất cả cuộn trong lô này. Mã vạch sẽ tự sinh riêng theo mã cuộn.
                  </span>
                </div>
              </div>
            </fieldset>

            {/* ===== CẤU HÌNH MÃ CUỘN ===== */}
            <fieldset className="bulk-section">
              <legend>Cấu hình mã cuộn tự động</legend>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="bulk_roll_prefix">
                    Tiền tố mã cuộn <span className="field-required">*</span>
                  </label>
                  <input
                    id="bulk_roll_prefix"
                    className={`field-input${errors.roll_prefix ? ' is-error' : ''}`}
                    type="text"
                    placeholder="VD: RM-"
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
              <p className="bulk-hint" style={{ marginTop: '0.75rem' }}>
                Mã cuộn trong bảng bên dưới được tạo tự động theo tiền tố và số bắt đầu để tránh lệch số thứ tự.
              </p>
            </fieldset>

            {/* ===== BẢNG NHẬP CUỘN ===== */}
            <fieldset className="bulk-section">
              <legend>
                Danh sách cuộn
                <span className="bulk-summary" style={{ marginLeft: '1rem', background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                  {totalRolls} cuộn · {totalWeight.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg
                </span>
              </legend>

              <div className="data-table-wrap" style={{ marginTop: '0.5rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Mã cuộn</th>
                      <th>Trọng lượng (kg) <span className="field-required">*</span></th>
                      <th className="hide-mobile">Dài (m)</th>
                      <th className="hide-mobile">CL</th>
                      <th className="hide-mobile">Ghi chú</th>
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
                            title="Mã cuộn được tạo tự động"
                            {...register(`rolls.${idx}.roll_number`)}
                            style={{ minWidth: '110px' }}
                          />
                          {errors.rolls?.[idx]?.roll_number && (
                            <span className="field-error">{errors.rolls[idx]?.roll_number?.message}</span>
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
                                style={{ minWidth: '80px' }}
                              />
                            )
                          })()}
                          {errors.rolls?.[idx]?.weight_kg && (
                            <span className="field-error">{errors.rolls[idx]?.weight_kg?.message}</span>
                          )}
                        </td>
                        <td className="hide-mobile">
                          <input
                            className="field-input bulk-input"
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="—"
                            {...register(`rolls.${idx}.length_m`)}
                          />
                        </td>
                        <td className="hide-mobile">
                          <select className="field-select bulk-input" {...register(`rolls.${idx}.quality_grade`)}>
                            <option value="">—</option>
                            {QUALITY_GRADES.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </td>
                        <td className="hide-mobile">
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

              <div className="bulk-add-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button className="btn-secondary" type="button" onClick={addRow}>
                  + 1 cuộn
                </button>
                <button className="btn-secondary hide-mobile" type="button" onClick={() => addMultipleRows(5)}>
                  + 5 cuộn
                </button>
                <button className="btn-secondary hide-mobile" type="button" onClick={() => addMultipleRows(10)}>
                  + 10 cuộn
                </button>
                <span className="bulk-hint hide-mobile" style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>Nhấn Enter trong ô trọng lượng để thêm dòng mới</span>
              </div>
            </fieldset>

            {/* ===== ACTIONS ===== */}
            <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none' }}>
              <button className="btn-secondary" type="button" onClick={onClose} disabled={isPending}>
                Hủy
              </button>
              <button
                className="primary-button btn-standard"
                type="submit"
                disabled={isPending}
              >
                {isPending
                  ? 'Đang lưu...'
                  : `Nhập ${totalRolls} cuộn`}
              </button>
            </div>
          </form>
        </>
      )}
    </AdaptiveSheet>
  )
}
