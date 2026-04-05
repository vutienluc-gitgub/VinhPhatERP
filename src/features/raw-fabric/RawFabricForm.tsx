import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  rawFabricDefaults,
  rawFabricSchema,
} from './raw-fabric.module'
import type { RawFabricFormValues } from './raw-fabric.module'
import type { RawFabricRoll } from './types'
import { useCreateRawFabric, useUpdateRawFabric, useWeavingPartners, useWorkOrderOptions, useYarnReceiptOptions } from './useRawFabric'
import { QuickSupplierForm } from '@/shared/components/QuickSupplierForm'

/* ── Collapsible form section ── */
function FormSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="form-section">
      <div className="form-section-header" onClick={() => setOpen((v) => !v)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v) }}>
        <span className="form-section-title">{title}</span>
        <span className="form-section-toggle" data-open={open}>▼</span>
      </div>
      {open && <div className="form-section-body">{children}</div>}
    </div>
  )
}

type RawFabricFormProps = {
  roll: RawFabricRoll | null
  onClose: () => void
}

function rollToFormValues(roll: RawFabricRoll): RawFabricFormValues {
  return {
    roll_number: roll.roll_number,
    fabric_type: roll.fabric_type,
    color_name: roll.color_name ?? '',
    color_code: roll.color_code ?? '',
    width_cm: roll.width_cm ?? undefined,
    length_m: roll.length_m ?? undefined,
    weight_kg: roll.weight_kg ?? undefined,
    quality_grade: roll.quality_grade ?? undefined,
    status: roll.status,
    warehouse_location: roll.warehouse_location ?? '',
    production_date: roll.production_date ?? '',
    notes: roll.notes ?? '',
    yarn_receipt_id: roll.yarn_receipt_id ?? '',
    weaving_partner_id: roll.weaving_partner_id ?? '',
    work_order_id: roll.work_order_id ?? '',
    lot_number: roll.lot_number ?? '',
  }
}

export function RawFabricForm({ roll, onClose }: RawFabricFormProps) {
  const isEditing = roll !== null
  const [showQuickSupplier, setShowQuickSupplier] = useState(false)
  const createMutation = useCreateRawFabric()
  const updateMutation = useUpdateRawFabric()
  const { data: weavingPartners = [] } = useWeavingPartners()
  const { data: yarnReceipts = [] } = useYarnReceiptOptions()
  const { data: workOrders = [] } = useWorkOrderOptions()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RawFabricFormValues>({
    resolver: zodResolver(rawFabricSchema),
    defaultValues: isEditing ? rollToFormValues(roll) : rawFabricDefaults,
  })

  useEffect(() => {
    reset(isEditing ? rollToFormValues(roll) : rawFabricDefaults)
  }, [roll, isEditing, reset])

  async function onSubmit(values: RawFabricFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: roll.id, values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch (err) {
      // Lỗi được hiển thị qua mutation.error bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error
  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">
            {isEditing ? `Sửa cuộn: ${roll.roll_number}` : 'Nhập cuộn vải mộc mới'}
          </h3>
          <button
            className="btn-icon"
            type="button"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          {mutationError && (
            <p className="field-error" style={{ marginBottom: '1rem' }}>
              Lỗi: {(mutationError as Error).message}
            </p>
          )}

          <form id="raw-fabric-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            {/* ── Section 1: Thông tin cuộn ── */}
            <FormSection title="Thông tin cuộn" defaultOpen={true}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="lot_number">Số lô (Lot number)</label>
                  <input
                    id="lot_number"
                    className="field-input"
                    type="text"
                    placeholder="VD: LOT-2026-001"
                    {...register('lot_number')}
                  />
                  <span className="field-hint">Nhóm các cuộn cùng lô sản xuất.</span>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="roll_number">
                      Mã cuộn <span className="field-required">*</span>
                    </label>
                    <input
                      id="roll_number"
                      className={`field-input${errors.roll_number ? ' is-error' : ''}`}
                      type="text"
                      placeholder="VD: RM-2024-001"
                      {...register('roll_number')}
                    />
                    {errors.roll_number && (
                      <span className="field-error">{errors.roll_number.message}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="fabric_type">
                      Loại vải <span className="field-required">*</span>
                    </label>
                    <input
                      id="fabric_type"
                      className={`field-input${errors.fabric_type ? ' is-error' : ''}`}
                      type="text"
                      placeholder="VD: Dệt thoi 60/40 TC"
                      {...register('fabric_type')}
                    />
                    {errors.fabric_type && (
                      <span className="field-error">{errors.fabric_type.message}</span>
                    )}
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="color_name">Màu vải</label>
                    <input
                      id="color_name"
                      className="field-input"
                      type="text"
                      placeholder="VD: Trắng ngà"
                      {...register('color_name')}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="color_code">Mã màu</label>
                    <input
                      id="color_code"
                      className="field-input"
                      type="text"
                      placeholder="VD: TC-01"
                      {...register('color_code')}
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="width_cm">Khổ vải (cm)</label>
                    <input
                      id="width_cm"
                      className={`field-input${errors.width_cm ? ' is-error' : ''}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="VD: 150"
                      {...register('width_cm')}
                    />
                    {errors.width_cm && (
                      <span className="field-error">{errors.width_cm.message}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="length_m">Độ dài (m)</label>
                    <input
                      id="length_m"
                      className={`field-input${errors.length_m ? ' is-error' : ''}`}
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="VD: 50"
                      {...register('length_m')}
                    />
                    {errors.length_m && (
                      <span className="field-error">{errors.length_m.message}</span>
                    )}
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="weight_kg">Trọng lượng (kg)</label>
                    <input
                      id="weight_kg"
                      className={`field-input${errors.weight_kg ? ' is-error' : ''}`}
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="VD: 25.5"
                      {...register('weight_kg')}
                    />
                    {errors.weight_kg && (
                      <span className="field-error">{errors.weight_kg.message}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="quality_grade">Chất lượng</label>
                    <select
                      id="quality_grade"
                      className="field-select"
                      {...register('quality_grade')}
                    >
                      <option value="">Chưa kiểm định</option>
                      {QUALITY_GRADES.map((g) => (
                        <option key={g} value={g}>{QUALITY_GRADE_LABELS[g]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="status">Trạng thái</label>
                    <select
                      id="status"
                      className="field-select"
                      {...register('status')}
                    >
                      {ROLL_STATUSES.map((s) => (
                        <option key={s} value={s}>{ROLL_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="production_date">Ngày dệt</label>
                    <input
                      id="production_date"
                      className="field-input"
                      type="date"
                      {...register('production_date')}
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* ── Section 2: Truy vết nguồn gốc ── */}
            <FormSection title="Truy vết nguồn gốc & Lệnh sản xuất" defaultOpen={!isEditing}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="work_order_id">Lệnh sản xuất (Work Order)</label>
                  <select
                    id="work_order_id"
                    className="field-select"
                    {...register('work_order_id')}
                  >
                    <option value="">— Không liên kết lệnh (Dự trữ) —</option>
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.work_order_number} ({wo.bom_template?.name})
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">Liên kết cuộn này với lệnh sản xuất để theo dõi tiến độ dệt.</span>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="weaving_partner_id">Nhà dệt gia công</label>
                    <select
                      id="weaving_partner_id"
                      className="field-select"
                      {...register('weaving_partner_id')}
                    >
                      <option value="">— Chọn nhà dệt —</option>
                      {weavingPartners.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="yarn_receipt_id">Phiếu nhập sợi nguồn</label>
                    <select
                      id="yarn_receipt_id"
                      className="field-select"
                      {...register('yarn_receipt_id')}
                    >
                      <option value="">— Chọn phiếu sợi —</option>
                      {yarnReceipts.map((r) => (
                        <option key={r.id} value={r.id}>{r.receipt_number} ({r.receipt_date})</option>
                      ))}
                    </select>
                  </div>
                </div>
                {!showQuickSupplier && (
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setShowQuickSupplier(true)}
                  >
                    + Tạo nhà dệt mới
                  </button>
                )}
                {showQuickSupplier && (
                  <QuickSupplierForm
                    defaultCategory="weaving"
                    onCreated={(created) => {
                      setValue('weaving_partner_id', created.id)
                      setShowQuickSupplier(false)
                    }}
                    onCancel={() => setShowQuickSupplier(false)}
                  />
                )}
              </div>
            </FormSection>

            {/* ── Section 3: Kho & ghi chú ── */}
            <FormSection title="Vị trí kho & ghi chú" defaultOpen={!isEditing}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="warehouse_location">Vị trí kho</label>
                  <input
                    id="warehouse_location"
                    className="field-input"
                    type="text"
                    placeholder="VD: A1-R3-S2"
                    {...register('warehouse_location')}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="notes">Ghi chú</label>
                  <textarea
                    id="notes"
                    className="field-textarea"
                    placeholder="Ghi chú thêm về cuộn vải..."
                    {...register('notes')}
                  />
                </div>
              </div>
            </FormSection>
          </div>
        </form>
      </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </button>
          <button
            className="btn-primary"
            type="submit"
            form="raw-fabric-form"
            disabled={isPending}
          >
            {isPending ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Nhập kho'}
          </button>
        </div>
      </div>
    </div>
  )
}
