import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  finishedFabricDefaults,
  finishedFabricSchema,
} from './finished-fabric.module'
import type { FinishedFabricFormValues } from './finished-fabric.module'
import type { FinishedFabricRoll } from './types'
import {
  useCreateFinishedFabric,
  useRawRollOptions,
  useUpdateFinishedFabric,
} from './useFinishedFabric'

type FinishedFabricFormProps = {
  roll: FinishedFabricRoll | null
  onClose: () => void
}

function rollToFormValues(roll: FinishedFabricRoll): FinishedFabricFormValues {
  return {
    roll_number: roll.roll_number,
    raw_roll_id: roll.raw_roll_id ?? '',
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
  }
}

export function FinishedFabricForm({ roll, onClose }: FinishedFabricFormProps) {
  const isEditing = roll !== null
  const createMutation = useCreateFinishedFabric()
  const updateMutation = useUpdateFinishedFabric()
  const { data: rawRollOptions = [] } = useRawRollOptions()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FinishedFabricFormValues>({
    resolver: zodResolver(finishedFabricSchema),
    defaultValues: isEditing ? rollToFormValues(roll) : finishedFabricDefaults,
  })

  useEffect(() => {
    reset(isEditing ? rollToFormValues(roll) : finishedFabricDefaults)
  }, [roll, isEditing, reset])

  async function onSubmit(values: FinishedFabricFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: roll.id, values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch {
      // Lỗi hiển thị qua mutationError bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error
  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">
            {isEditing ? `Sửa cuộn: ${roll.roll_number}` : 'Nhập cuộn vải thành phẩm mới'}
          </h3>
          <button
            className="btn-icon"
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{ fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>

        {mutationError && (
          <p style={{ color: '#c0392b', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
            Lỗi: {(mutationError as Error).message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            {/* Hàng 1: Mã cuộn + Loại vải */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="roll_number">
                  Mã cuộn <span className="field-required">*</span>
                </label>
                <input
                  id="roll_number"
                  className={`field-input${errors.roll_number ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: FN-2026-001"
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

            {/* Cuộn mộc nguồn */}
            <div className="form-field">
              <label htmlFor="raw_roll_id">Cuộn vải mộc nguồn</label>
              <select
                id="raw_roll_id"
                className="field-select"
                {...register('raw_roll_id')}
              >
                <option value="">— Không liên kết —</option>
                {rawRollOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roll_number} — {r.fabric_type}
                    {r.color_name ? ` (${r.color_name})` : ''}
                  </option>
                ))}
              </select>
              <span className="field-hint">Chọn cuộn mộc để truy vết nguồn gốc thành phẩm.</span>
            </div>

            {/* Hàng 2: Màu */}
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

            {/* Hàng 3: Khổ + Dài */}
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

            {/* Hàng 4: Trọng lượng + Chất lượng */}
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
                    <option key={g} value={g}>
                      {QUALITY_GRADE_LABELS[g]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hàng 5: Trạng thái + Ngày sản xuất */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="status">Trạng thái</label>
                <select
                  id="status"
                  className="field-select"
                  {...register('status')}
                >
                  {ROLL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ROLL_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="production_date">Ngày hoàn thành</label>
                <input
                  id="production_date"
                  className="field-input"
                  type="date"
                  {...register('production_date')}
                />
              </div>
            </div>

            {/* Vị trí kho */}
            <div className="form-field">
              <label htmlFor="warehouse_location">Vị trí kho</label>
              <input
                id="warehouse_location"
                className="field-input"
                type="text"
                placeholder="VD: B2-R1-S4"
                {...register('warehouse_location')}
              />
            </div>

            {/* Ghi chú */}
            <div className="form-field">
              <label htmlFor="notes">Ghi chú</label>
              <textarea
                id="notes"
                className="field-textarea"
                placeholder="Ghi chú thêm về cuộn thành phẩm..."
                {...register('notes')}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="btn-secondary"
              type="button"
              onClick={onClose}
              disabled={isPending}
            >
              Hủy
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={isPending}
              style={{ minHeight: 40, padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
            >
              {isPending ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
