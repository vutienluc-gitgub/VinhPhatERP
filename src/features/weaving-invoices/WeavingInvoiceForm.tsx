import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm, useWatch, Controller } from 'react-hook-form'

import { useFabricCatalogOptions } from '@/features/fabric-catalog/useFabricCatalog'

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet'
import { Combobox } from '@/shared/components/Combobox'
import { useStepper } from '@/shared/hooks/useStepper'

import type { WeavingInvoice } from './types'
import {
  useCreateWeavingInvoice,
  useUpdateWeavingInvoice,
  useNextWeavingInvoiceNumber,
  useWeavingSuppliers,
} from './useWeavingInvoices'
import {
  weavingInvoiceFormSchema,
  weavingInvoiceDefaults,
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
} from './weaving-invoices.module'
import type { WeavingInvoiceFormValues } from './weaving-invoices.module'

type Props = {
  invoice?: WeavingInvoice | null
  onClose: () => void
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n))
}

export function WeavingInvoiceForm({ invoice, onClose }: Props) {
  const isEdit = !!invoice
  const stepper = useStepper({ totalSteps: 2 })

  const { data: nextNumber = '' } = useNextWeavingInvoiceNumber()
  const { data: suppliers = [] } = useWeavingSuppliers()
  const { data: fabricOptions = [] } = useFabricCatalogOptions()
  const createMutation = useCreateWeavingInvoice()
  const updateMutation = useUpdateWeavingInvoice()

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WeavingInvoiceFormValues>({
    resolver: zodResolver(weavingInvoiceFormSchema),
    defaultValues: invoice
      ? {
          invoice_number: invoice.invoice_number,
          supplier_id: invoice.supplier_id,
          invoice_date: invoice.invoice_date,
          fabric_type: invoice.fabric_type,
          unit_price_per_kg: invoice.unit_price_per_kg,
          notes: invoice.notes ?? '',
          rolls: invoice.weaving_invoice_rolls?.map((r) => ({
            roll_number: r.roll_number,
            weight_kg: r.weight_kg,
            length_m: r.length_m ?? undefined,
            quality_grade: r.quality_grade ?? undefined,
            warehouse_location: r.warehouse_location ?? '',
            lot_number: r.lot_number ?? '',
            notes: r.notes ?? '',
          })) ?? weavingInvoiceDefaults.rolls,
        }
      : weavingInvoiceDefaults,
    mode: 'onTouched',
  })

  // Auto-fill invoice number for new invoices
  useEffect(() => {
    if (!isEdit && nextNumber) setValue('invoice_number', nextNumber)
  }, [nextNumber, isEdit, setValue])

  const { fields, append, remove } = useFieldArray({ control, name: 'rolls' })
  const watchedRolls = useWatch({ control, name: 'rolls' })
  const unitPrice = useWatch({ control, name: 'unit_price_per_kg' }) ?? 0

  // Live total calculation
  const totalKg = (watchedRolls ?? []).reduce(
    (sum, r) => sum + (parseFloat(String(r.weight_kg)) || 0),
    0,
  )
  const totalAmount = totalKg * (unitPrice ?? 0)

  async function handleNext() {
    const valid = await trigger([
      'invoice_number', 'supplier_id', 'invoice_date', 'fabric_type', 'unit_price_per_kg',
    ])
    if (valid) stepper.next()
  }

  async function onSubmit(values: WeavingInvoiceFormValues) {
    if (!stepper.isLast) return
    if (isEdit && invoice) {
      await updateMutation.mutateAsync({ id: invoice.id, values })
    } else {
      await createMutation.mutateAsync(values)
    }
    onClose()
  }

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error ?? updateMutation.error

  const supplierOptions = suppliers.map((s) => ({ label: s.name, value: s.id, code: s.code }))
  const fabricComboOptions = fabricOptions.map((f) => ({ label: f.name, value: f.name, code: f.code }))

  return (
    <AdaptiveSheet
      open
      onClose={onClose}
      title={isEdit ? 'Sửa phiếu gia công' : 'Tạo phiếu gia công'}
      stepInfo={{ current: stepper.currentStep, total: stepper.totalSteps }}
      maxWidth={900}
    >
      {mutationError && (
        <p className="error-inline" style={{ marginBottom: '1rem' }}>
          {(mutationError as Error).message}
        </p>
      )}

      <form id="weaving-form" onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── BƯỚC 1: THÔNG TIN PHIẾU ── */}
        <div style={{ display: stepper.currentStep === 0 ? 'block' : 'none' }}>
          <fieldset className="bulk-section">
            <legend>Thông tin phiếu gia công</legend>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>

              {/* Số phiếu */}
              <div className="form-field">
                <label>Số phiếu <span className="field-required">*</span></label>
                <input className={`field-input${errors.invoice_number ? ' is-error' : ''}`} {...register('invoice_number')} />
                {errors.invoice_number && <span className="field-error">{errors.invoice_number.message}</span>}
              </div>

              {/* Nhà dệt */}
              <div className="form-field">
                <label>Nhà dệt <span className="field-required">*</span></label>
                <Controller
                  control={control}
                  name="supplier_id"
                  render={({ field }) => (
                    <Combobox
                      options={supplierOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Chọn nhà dệt..."
                      hasError={!!errors.supplier_id}
                    />
                  )}
                />
                {errors.supplier_id && <span className="field-error">{errors.supplier_id.message}</span>}
              </div>

              {/* Ngày */}
              <div className="form-field">
                <label>Ngày <span className="field-required">*</span></label>
                <input type="date" className={`field-input${errors.invoice_date ? ' is-error' : ''}`} {...register('invoice_date')} />
                {errors.invoice_date && <span className="field-error">{errors.invoice_date.message}</span>}
              </div>

              {/* Loại vải */}
              <div className="form-field">
                <label>Loại vải <span className="field-required">*</span></label>
                <Controller
                  control={control}
                  name="fabric_type"
                  render={({ field }) => (
                    <Combobox
                      options={fabricComboOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Chọn hoặc nhập loại vải..."
                      hasError={!!errors.fabric_type}
                      allowInput
                    />
                  )}
                />
                {errors.fabric_type && <span className="field-error">{errors.fabric_type.message}</span>}
              </div>

              {/* Đơn giá */}
              <div className="form-field">
                <label>Đơn giá gia công (đ/kg) <span className="field-required">*</span></label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  className={`field-input${errors.unit_price_per_kg ? ' is-error' : ''}`}
                  {...register('unit_price_per_kg')}
                />
                {errors.unit_price_per_kg && <span className="field-error">{errors.unit_price_per_kg.message}</span>}
              </div>

              {/* Ghi chú */}
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Ghi chú</label>
                <textarea className="field-input" rows={2} {...register('notes')} />
              </div>
            </div>
          </fieldset>

          <div className="sheet-footer" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
            <button type="button" className="primary-button btn-standard" onClick={handleNext}>
              Tiếp theo → Nhập cuộn vải
            </button>
          </div>
        </div>

        {/* ── BƯỚC 2: NHẬP CUỘN VẢI ── */}
        <div style={{ display: stepper.currentStep === 1 ? 'block' : 'none' }}>
          {/* Summary bar */}
          <div className="bulk-summary" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <span>Tổng <strong>{fields.length}</strong> cuộn</span>
            <span>Tổng KG: <strong>{totalKg.toFixed(2)} kg</strong></span>
            <span>Thành tiền: <strong>{formatCurrency(totalAmount)} đ</strong></span>
          </div>

          {errors.rolls?.root && (
            <p className="error-inline" style={{ marginBottom: '0.5rem' }}>{errors.rolls.root.message}</p>
          )}

          {/* Rolls table */}
          <div className="data-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Mã cuộn *</th>
                  <th>KG *</th>
                  <th>Dài (m)</th>
                  <th>Loại</th>
                  <th>Vị trí kho</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => (
                  <tr key={field.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>{idx + 1}</td>
                    <td>
                      <input
                        className={`field-input${errors.rolls?.[idx]?.roll_number ? ' is-error' : ''}`}
                        placeholder="VD: VP-001"
                        style={{ minWidth: 120 }}
                        {...register(`rolls.${idx}.roll_number`)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        className={`field-input${errors.rolls?.[idx]?.weight_kg ? ' is-error' : ''}`}
                        style={{ width: 90 }}
                        {...register(`rolls.${idx}.weight_kg`)}
                      />
                    </td>
                    <td>
                      <input type="number" step="0.1" min="0" className="field-input" style={{ width: 80 }} {...register(`rolls.${idx}.length_m`)} />
                    </td>
                    <td>
                      <select className="field-select" style={{ width: 90 }} {...register(`rolls.${idx}.quality_grade`)}>
                        <option value="">—</option>
                        {QUALITY_GRADES.map((g) => (
                          <option key={g} value={g}>{QUALITY_GRADE_LABELS[g]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input className="field-input" placeholder="A1-R3" style={{ width: 100 }} {...register(`rolls.${idx}.warehouse_location`)} />
                    </td>
                    <td>
                      {fields.length > 1 && (
                        <button type="button" className="btn-icon danger" onClick={() => remove(idx)} title="Xóa dòng">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => append({ roll_number: '', weight_kg: undefined as unknown as number, length_m: undefined, quality_grade: undefined, warehouse_location: '', lot_number: '', notes: '' })}
            >
              + Thêm cuộn
            </button>
            {[5, 10].map((n) => (
              <button
                key={n}
                type="button"
                className="btn-secondary"
                onClick={() => {
                  for (let i = 0; i < n; i++) {
                    append({ roll_number: '', weight_kg: undefined as unknown as number, length_m: undefined, quality_grade: undefined, warehouse_location: '', lot_number: '', notes: '' })
                  }
                }}
              >
                +{n}
              </button>
            ))}
          </div>

          <div className="sheet-footer" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={stepper.prev}>← Quay lại</button>
            <button
              type="submit"
              form="weaving-form"
              className="primary-button btn-standard"
              disabled={isPending}
            >
              {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Lưu phiếu nháp'}
            </button>
          </div>
        </div>

      </form>
    </AdaptiveSheet>
  )
}
