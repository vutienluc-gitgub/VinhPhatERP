import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet'
import { Combobox } from '@/shared/components/Combobox'
import { useColorOptions, toColorComboboxOptions } from '@/shared/hooks/useColorOptions'

import type { YarnCatalog } from './types'
import {
  useCreateYarnCatalog,
  useNextYarnCatalogCode,
  useUpdateYarnCatalog,
} from './useYarnCatalog'
import {
  yarnCatalogDefaultValues,
  yarnCatalogSchema,
  YARN_CATALOG_STATUS_LABELS,
} from './yarn-catalog.module'
import type { YarnCatalogFormValues } from './yarn-catalog.module'

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
  const { data: colorOptions = [] } = useColorOptions()

  const {
    register,
    control,
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
    <AdaptiveSheet open={true} onClose={onClose} title={isEditing ? `Sửa: ${catalog.name}` : 'Thêm loại sợi'}>
      {mutationError && (
        <p className="error-inline" style={{ marginBottom: '1rem' }}>
          Lỗi: {(mutationError as Error).message}
        </p>
      )}

      <form id="yarn-catalog-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Mã + Tên */}
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
              <Controller
                name="color_name"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={toColorComboboxOptions(colorOptions)}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Chọn hoặc nhập màu..."
                  />
                )}
              />
            </div>
          </div>

          {/* Cường lực + Xuất xứ */}
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="form-field">
              <label htmlFor="unit">
                Đơn vị <span className="field-required">*</span>
              </label>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={[
                      { value: 'kg', label: 'kg' },
                      { value: 'cuộn', label: 'cuộn' },
                      { value: 'tấn', label: 'tấn' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.unit}
                    placeholder="Chọn..."
                  />
                )}
              />
              {errors.unit && (
                <span className="field-error">{errors.unit.message}</span>
              )}
            </div>

            <div className="form-field">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={(['active', 'inactive'] as const).map((s) => ({
                      value: s,
                      label: YARN_CATALOG_STATUS_LABELS[s],
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.status}
                  />
                )}
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div className="form-field">
            <label htmlFor="notes">Ghi chú</label>
            <textarea
              id="notes"
              className="field-textarea"
              rows={2}
              placeholder="Ghi chú về loại sợi..."
              {...register('notes')}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none' }}>
          <button
            className="btn-secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </button>
          <button className="primary-button btn-standard" type="submit" disabled={isPending}>
            {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Thêm loại sợi'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  )
}
