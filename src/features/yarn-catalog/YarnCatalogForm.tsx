import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import {
  yarnCatalogDefaultValues,
  yarnCatalogSchema,
  YARN_CATALOG_STATUS_LABELS,
} from './yarn-catalog.module'
import type { YarnCatalogFormValues } from './yarn-catalog.module'
import type { YarnCatalog } from './types'
import {
  useCreateYarnCatalog,
  useNextYarnCatalogCode,
  useUpdateYarnCatalog,
} from './useYarnCatalog'

type YarnCatalogFormProps = {
  catalog: YarnCatalog | null
  onClose: () => void
}

function catalogToFormValues(catalog: YarnCatalog): YarnCatalogFormValues {
  return {
    code: catalog.code,
    name: catalog.name,
    composition: catalog.composition ?? '',
    color_name: catalog.color_name ?? '',
    tensile_strength: catalog.tensile_strength ?? '',
    origin: catalog.origin ?? '',
    unit: catalog.unit,
    notes: catalog.notes ?? '',
    status: catalog.status,
  }
}

export function YarnCatalogForm({ catalog, onClose }: YarnCatalogFormProps) {
  const isEditing = catalog !== null
  const createMutation = useCreateYarnCatalog()
  const updateMutation = useUpdateYarnCatalog()
  const { data: nextCode } = useNextYarnCatalogCode()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<YarnCatalogFormValues>({
    resolver: zodResolver(yarnCatalogSchema),
    defaultValues: isEditing ? catalogToFormValues(catalog) : yarnCatalogDefaultValues,
  })

  useEffect(() => {
    reset(isEditing ? catalogToFormValues(catalog) : yarnCatalogDefaultValues)
  }, [catalog, isEditing, reset])

  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode)
    }
  }, [isEditing, nextCode, setValue])

  async function onSubmit(values: YarnCatalogFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: catalog.id, values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch {
      // Lỗi hiện qua mutationError bên dưới
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
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ maxWidth: 560 }}
      >
        <div className="modal-header">
          <h3 id="modal-title">
            {isEditing ? `Sửa: ${catalog.name}` : 'Thêm loại sợi'}
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
            {/* Mã + Tên */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="code">
                  Mã sợi <span className="field-required">*</span>
                </label>
                <input
                  id="code"
                  className={`field-input${errors.code ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: YS-001"
                  readOnly={!isEditing}
                  {...register('code')}
                />
                {errors.code && (
                  <span className="field-error">{errors.code.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="name">
                  Tên loại sợi <span className="field-required">*</span>
                </label>
                <input
                  id="name"
                  className={`field-input${errors.name ? ' is-error' : ''}`}
                  type="text"
                  placeholder="VD: Cotton 40/1"
                  {...register('name')}
                />
                {errors.name && (
                  <span className="field-error">{errors.name.message}</span>
                )}
              </div>
            </div>

            {/* Thành phần + Màu mặc định */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="composition">Thành phần</label>
                <input
                  id="composition"
                  className="field-input"
                  type="text"
                  placeholder="VD: 100% Cotton"
                  {...register('composition')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="color_name">Màu mặc định</label>
                <input
                  id="color_name"
                  className="field-input"
                  type="text"
                  placeholder="VD: Trắng ngà"
                  {...register('color_name')}
                />
              </div>
            </div>

            {/* Cường lực + Xuất xứ */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="tensile_strength">Cường lực</label>
                <input
                  id="tensile_strength"
                  className="field-input"
                  type="text"
                  placeholder="VD: 18 cN/tex"
                  {...register('tensile_strength')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="origin">Xuất xứ</label>
                <input
                  id="origin"
                  className="field-input"
                  type="text"
                  placeholder="VD: Việt Nam"
                  {...register('origin')}
                />
              </div>
            </div>

            {/* Đơn vị + Trạng thái */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="unit">
                  Đơn vị <span className="field-required">*</span>
                </label>
                <select
                  id="unit"
                  className={`field-select${errors.unit ? ' is-error' : ''}`}
                  {...register('unit')}
                >
                  <option value="kg">kg</option>
                  <option value="cuộn">cuộn</option>
                  <option value="tấn">tấn</option>
                </select>
                {errors.unit && (
                  <span className="field-error">{errors.unit.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="status">Trạng thái</label>
                <select id="status" className="field-select" {...register('status')}>
                  {(['active', 'inactive'] as const).map((s) => (
                    <option key={s} value={s}>
                      {YARN_CATALOG_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="form-field">
              <label htmlFor="notes">Ghi chú</label>
              <textarea
                id="notes"
                className="field-input"
                rows={2}
                placeholder="Ghi chú về loại sợi..."
                style={{ resize: 'vertical' }}
                {...register('notes')}
              />
            </div>
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
            <button className="primary-button" type="submit" disabled={isPending}>
              {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Thêm loại sợi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
