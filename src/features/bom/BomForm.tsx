import { useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { ArrowLeft, Plus, Trash2 } from '@/shared/icons'
import { Combobox } from '@/shared/components/Combobox'

import { bomTemplateSchema, BomTemplateFormData } from './bom.module'
import { BomTemplate } from './types'
import { useFabricCatalogs, useYarnCatalogs, useDraftBom, useUpdateDraftBom } from './useBom'

interface BomFormProps {
  initialData?: BomTemplate
  onSuccess: () => void
  onCancel: () => void
}

export function BomForm({ initialData, onSuccess, onCancel }: BomFormProps) {
  const { data: fabricCatalogs = [] } = useFabricCatalogs()
  const { data: yarnCatalogs = [] } = useYarnCatalogs()

  const createDraft = useDraftBom()
  const updateDraft = useUpdateDraftBom()

  const isEdit = !!initialData
  const isSubmitting = createDraft.isPending || updateDraft.isPending

  const defaultValues: BomTemplateFormData = {
    code: initialData?.code || '',
    name: initialData?.name || '',
    target_fabric_id: initialData?.target_fabric_id || '',
    target_width_cm: initialData?.target_width_cm || null,
    target_gsm: initialData?.target_gsm || null,
    standard_loss_pct: initialData?.standard_loss_pct || 5,
    notes: initialData?.notes || '',
    bom_yarn_items: initialData?.bom_yarn_items?.map((y) => ({
      id: y.id,
      yarn_catalog_id: y.yarn_catalog_id,
      ratio_pct: y.ratio_pct,
      consumption_kg_per_m: y.consumption_kg_per_m,
      notes: y.notes,
      sort_order: y.sort_order,
    })) || [{ yarn_catalog_id: '', ratio_pct: 100, consumption_kg_per_m: 0.5, sort_order: 0 }],
  }

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BomTemplateFormData>({
    resolver: zodResolver(bomTemplateSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'bom_yarn_items',
  })

  const watchItems = watch('bom_yarn_items')
  const totalRatio = watchItems.reduce((acc, curr) => acc + (Number(curr.ratio_pct) || 0), 0)

  // ── Tự sinh mã BOM: BOM-<mã sản phẩm mộc>-<mã sợi đầu tiên> ──
  const watchFabricId = watch('target_fabric_id')
  const watchFirstYarnId = watchItems?.[0]?.yarn_catalog_id

  useEffect(() => {
    if (isEdit) return // Không đổi mã khi sửa

    const fabric = fabricCatalogs.find((f) => f.id === watchFabricId)
    const yarn = yarnCatalogs.find((y) => y.id === watchFirstYarnId)

    const fabricCode = fabric?.code ?? ''
    const yarnCode = yarn?.code ?? ''

    if (fabricCode || yarnCode) {
      const parts = ['BOM', fabricCode, yarnCode].filter(Boolean)
      setValue('code', parts.join('-'), { shouldValidate: true })
    }
  }, [watchFabricId, watchFirstYarnId, fabricCatalogs, yarnCatalogs, isEdit, setValue])

  const onSubmit = async (data: BomTemplateFormData) => {
    try {
      if (isEdit) {
        await updateDraft.mutateAsync({ id: initialData.id, data })
      } else {
        await createDraft.mutateAsync(data)
      }
      onSuccess()
    } catch (err) {
      console.error(err)
      alert('Có lỗi xảy ra: ' + (err as Error).message)
    }
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-icon" type="button" onClick={onCancel} title="Quay lại">
              <ArrowLeft style={{ width: 18, height: 18 }} />
            </button>
            <div>
              <p className="eyebrow">Kỹ thuật</p>
              <h3>{isEdit ? 'Cập nhật bản nháp' : 'Tạo bản nháp định mức (BOM)'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Form content */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1.25rem' }}>
        {/* Basic info */}
        <div
          className="form-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}
        >
          <div className="form-field">
            <label>
              Mã BOM <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>(tự sinh)</span>
            </label>
            <input
              type="text"
              {...register('code')}
              readOnly
              className="field-input"
              placeholder="Chọn sản phẩm mộc + sợi → tự sinh"
              style={{ backgroundColor: 'var(--surface-raised)', cursor: 'default' }}
            />
            <span className="field-hint">Mã tự động: BOM‑&lt;mã vải mộc&gt;‑&lt;mã sợi&gt;</span>
          </div>

          <div className="form-field">
            <label>
              Tên BOM <span className="field-required">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              className={`field-input${errors.name ? ' is-error' : ''}`}
              placeholder="VD: Định mức Cotton 65/35..."
            />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>

          <div className="form-field">
            <label>
              Sản phẩm mộc <span className="field-required">*</span>
            </label>
            <Controller
              name="target_fabric_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={fabricCatalogs.map((fb) => ({
                    value: fb.id,
                    label: `${fb.code} — ${fb.name}`,
                    code: fb.code,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- Chọn sản phẩm mộc --"
                  hasError={!!errors.target_fabric_id}
                />
              )}
            />
            {errors.target_fabric_id && (
              <span className="field-error">{errors.target_fabric_id.message}</span>
            )}
          </div>
        </div>

        <div
          className="form-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '1rem' }}
        >
          <div className="form-field">
            <label>Khổ vải (cm)</label>
            <input
              type="number"
              {...register('target_width_cm', { valueAsNumber: true })}
              className="field-input"
            />
          </div>
          <div className="form-field">
            <label>Định lượng (gsm)</label>
            <input
              type="number"
              {...register('target_gsm', { valueAsNumber: true })}
              className="field-input"
            />
          </div>
          <div className="form-field">
            <label>Hao hụt mặc định (%)</label>
            <input
              type="number"
              step="0.01"
              {...register('standard_loss_pct', { valueAsNumber: true })}
              className="field-input"
            />
          </div>
          <div className="form-field">
            <label>Ghi chú</label>
            <input
              type="text"
              {...register('notes')}
              className="field-input"
              placeholder="Thông tin bổ sung..."
            />
          </div>
        </div>

        {/* Yarn Items Section */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>Thành phần nguyên liệu</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
                Tổng tỉ lệ:{' '}
                <strong style={{ color: Math.abs(totalRatio - 100) > 0.01 ? 'var(--danger)' : 'var(--success)' }}>
                  {totalRatio.toFixed(2)}%
                </strong>
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => append({ yarn_catalog_id: '', ratio_pct: 0, consumption_kg_per_m: 0.5, sort_order: fields.length })}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Thêm sợi
            </button>
          </div>

          {errors.bom_yarn_items?.root && (
            <p className="field-error" style={{ marginBottom: '0.75rem' }}>
              {errors.bom_yarn_items.root.message}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fields.map((field, index) => (
              <div
                key={field.id}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div className="form-grid" style={{ flex: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                  <div className="form-field">
                    <label>Loại sợi</label>
                    <Controller
                      name={`bom_yarn_items.${index}.yarn_catalog_id` as const}
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={yarnCatalogs.map((y) => ({
                            value: y.id,
                            label: `${y.code} — ${y.name} (${y.composition})`,
                            code: y.code,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="— Chọn sợi —"
                          hasError={!!errors.bom_yarn_items?.[index]?.yarn_catalog_id}
                        />
                      )}
                    />
                    {errors.bom_yarn_items?.[index]?.yarn_catalog_id && (
                      <span className="field-error">{errors.bom_yarn_items[index]?.yarn_catalog_id?.message}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Tỉ lệ (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`bom_yarn_items.${index}.ratio_pct`, { valueAsNumber: true })}
                      className={`field-input${errors.bom_yarn_items?.[index]?.ratio_pct ? ' is-error' : ''}`}
                    />
                    {errors.bom_yarn_items?.[index]?.ratio_pct && (
                      <span className="field-error">{errors.bom_yarn_items[index]?.ratio_pct?.message}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Tiêu hao (kg/m)</label>
                    <input
                      type="number"
                      step="0.0001"
                      {...register(`bom_yarn_items.${index}.consumption_kg_per_m`, { valueAsNumber: true })}
                      className={`field-input${errors.bom_yarn_items?.[index]?.consumption_kg_per_m ? ' is-error' : ''}`}
                    />
                    {errors.bom_yarn_items?.[index]?.consumption_kg_per_m && (
                      <span className="field-error">{errors.bom_yarn_items[index]?.consumption_kg_per_m?.message}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => remove(index)}
                  title="Xóa dòng"
                  style={{ marginTop: '1.6rem', flexShrink: 0 }}
                >
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="table-empty" style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                Chưa có loại sợi nào. Nhấn "Thêm sợi" để bắt đầu.
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Huỷ bỏ
          </button>
          <button
            type="submit"
            className="primary-button btn-standard"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu bản nháp'}
          </button>
        </div>
      </form>
    </div>
  )
}
