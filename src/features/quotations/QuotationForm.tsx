import { useActiveCustomers } from '@/shared/hooks/useActiveCustomers'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatCurrency } from '@/shared/utils/format'
import { useEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import {
  calculateQuotationTotals,
  DISCOUNT_TYPE_OPTIONS,
  emptyQuotationItem,
  quotationsDefaultValues,
  quotationsSchema,
  UNIT_OPTIONS,
  VAT_RATE_OPTIONS,
} from './quotations.module'
import type { QuotationsFormValues } from './quotations.module'
import type { DiscountType, Quotation } from './types'
import { useCreateQuotation,
  useNextQuotationNumber,
  useUpdateQuotation,
} from './useQuotations'

const UNIT_LABELS: Record<string, string> = { m: 'm', kg: 'kg' }

type QuotationFormProps = {
  quotation: Quotation | null
  onClose: () => void
}

function quotationToFormValues(q: Quotation): QuotationsFormValues {
  return {
    quotationNumber: q.quotation_number,
    customerId: q.customer_id,
    quotationDate: q.quotation_date,
    validUntil: q.valid_until ?? '',
    discountType: q.discount_type,
    discountValue: Number(q.discount_value),
    vatRate: Number(q.vat_rate),
    deliveryTerms: q.delivery_terms ?? '',
    paymentTerms: q.payment_terms ?? '',
    notes: q.notes ?? '',
    items: (q.quotation_items ?? []).map((it) => ({
      fabricType: it.fabric_type,
      colorName: it.color_name ?? '',
      colorCode: it.color_code ?? '',
      widthCm: it.width_cm ? Number(it.width_cm) : 0,
      unit: (it.unit === 'kg' ? 'kg' : 'm') as 'm' | 'kg',
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
      leadTimeDays: it.lead_time_days ?? 0,
      notes: it.notes ?? '',
    })),
  }
}



/* ── Realtime totals ── */

function TotalsSummary({ control }: { control: ReturnType<typeof useForm<QuotationsFormValues>>['control'] }) {
  const items = useWatch({ control, name: 'items' })
  const discountType = useWatch({ control, name: 'discountType' }) as DiscountType
  const discountValue = useWatch({ control, name: 'discountValue' }) ?? 0
  const vatRate = useWatch({ control, name: 'vatRate' }) ?? 10

  const totals = calculateQuotationTotals(items ?? [], discountType, Number(discountValue), Number(vatRate))

  return (
    <div
      style={{
        borderTop: '2px solid var(--border)',
        padding: '0.75rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        fontSize: '0.92rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Tạm tính:</span>
        <span>{formatCurrency(totals.subtotal)} đ</span>
      </div>
      {totals.discountAmount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c0392b' }}>
          <span>Chiết khấu:</span>
          <span>-{formatCurrency(totals.discountAmount)} đ</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Trước VAT:</span>
        <span>{formatCurrency(totals.totalBeforeVat)} đ</span>
      </div>
      {totals.vatAmount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>VAT ({vatRate}%):</span>
          <span>+{formatCurrency(totals.vatAmount)} đ</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
        <span>Tổng cộng:</span>
        <span>{formatCurrency(totals.totalAmount)} đ</span>
      </div>
    </div>
  )
}

/* ── Quantity + Unit Price fields ── */

type ItemFieldsProps = {
  control: ReturnType<typeof useForm<QuotationsFormValues>>['control']
  index: number
  register: ReturnType<typeof useForm<QuotationsFormValues>>['register']
  errors: ReturnType<typeof useForm<QuotationsFormValues>>['formState']['errors']
}

function ItemQuantityFields({ control, index, register, errors }: ItemFieldsProps) {
  const unit = useWatch({ control, name: `items.${index}.unit` }) ?? 'm'
  const unitLabel = UNIT_LABELS[unit] ?? unit

  return (
    <>
      <div className="form-field">
        <label htmlFor={`items.${index}.quantity`}>
          Số lượng ({unitLabel}) <span className="field-required">*</span>
        </label>
        <input
          id={`items.${index}.quantity`}
          className={`field-input${errors.items?.[index]?.quantity ? ' is-error' : ''}`}
          type="number"
          step="0.001"
          min="0"
          placeholder="0"
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
        />
        {errors.items?.[index]?.quantity && (
          <span className="field-error">
            {errors.items[index].quantity.message}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor={`items.${index}.unitPrice`}>
          Đơn giá (đ/{unitLabel}) <span className="field-required">*</span>
        </label>
        <input
          id={`items.${index}.unitPrice`}
          className={`field-input${errors.items?.[index]?.unitPrice ? ' is-error' : ''}`}
          type="number"
          step="1"
          min="0"
          placeholder="0"
          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
        />
        {errors.items?.[index]?.unitPrice && (
          <span className="field-error">
            {errors.items[index].unitPrice.message}
          </span>
        )}
      </div>
    </>
  )
}

export function QuotationForm({ quotation, onClose }: QuotationFormProps) {
  const isEditing = quotation !== null
  const createMutation = useCreateQuotation()
  const updateMutation = useUpdateQuotation()
  const { data: nextNumber } = useNextQuotationNumber()
  const { data: customers = [] } = useActiveCustomers()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuotationsFormValues>({
    resolver: zodResolver(quotationsSchema),
    defaultValues: isEditing
      ? quotationToFormValues(quotation)
      : quotationsDefaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  useEffect(() => {
    reset(isEditing ? quotationToFormValues(quotation) : quotationsDefaultValues)
  }, [quotation, isEditing, reset])

  useEffect(() => {
    if (!isEditing && nextNumber) {
      setValue('quotationNumber', nextNumber)
    }
  }, [isEditing, nextNumber, setValue])

  async function onSubmit(values: QuotationsFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: quotation.id, values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch {
      // Error displayed via mutationError below
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending

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
        style={{ maxWidth: 780 }}
      >
        <div className="modal-header">
          <h3 id="modal-title">
            {isEditing
              ? `Sửa báo giá: ${quotation.quotation_number}`
              : 'Tạo báo giá mới'}
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
          <p style={{ color: '#c0392b', fontSize: '0.88rem', marginBottom: '0.75rem', padding: '0 1.25rem' }}>
            Lỗi: {(mutationError as Error).message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            {/* Row 1: Số BG + Ngày BG */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="quotationNumber">
                  Số báo giá <span className="field-required">*</span>
                </label>
                <input
                  id="quotationNumber"
                  className={`field-input${errors.quotationNumber ? ' is-error' : ''}`}
                  type="text"
                  readOnly={!isEditing}
                  {...register('quotationNumber')}
                />
                {errors.quotationNumber && (
                  <span className="field-error">{errors.quotationNumber.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="quotationDate">
                  Ngày báo giá <span className="field-required">*</span>
                </label>
                <input
                  id="quotationDate"
                  className={`field-input${errors.quotationDate ? ' is-error' : ''}`}
                  type="date"
                  {...register('quotationDate')}
                />
                {errors.quotationDate && (
                  <span className="field-error">{errors.quotationDate.message}</span>
                )}
              </div>
            </div>

            {/* Row 2: Khách hàng + Hết hiệu lực */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="customerId">
                  Khách hàng <span className="field-required">*</span>
                </label>
                <select
                  id="customerId"
                  className={`field-select${errors.customerId ? ' is-error' : ''}`}
                  {...register('customerId')}
                >
                  <option value="">— Chọn khách hàng —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <span className="field-error">{errors.customerId.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="validUntil">Hiệu lực đến</label>
                <input
                  id="validUntil"
                  className={`field-input${errors.validUntil ? ' is-error' : ''}`}
                  type="date"
                  {...register('validUntil')}
                />
                {errors.validUntil && (
                  <span className="field-error">{errors.validUntil.message}</span>
                )}
              </div>
            </div>

            {/* Line items */}
            <div className="form-field">
              <label>
                Dòng hàng <span className="field-required">*</span>
              </label>
              {errors.items?.root && (
                <span className="field-error" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  {errors.items.root.message}
                </span>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Dòng {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <button
                          className="btn-icon danger"
                          type="button"
                          title="Xóa dòng"
                          onClick={() => remove(index)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="form-grid form-grid-2">
                      <div className="form-field">
                        <label htmlFor={`items.${index}.fabricType`}>
                          Loại vải <span className="field-required">*</span>
                        </label>
                        <input
                          id={`items.${index}.fabricType`}
                          className={`field-input${errors.items?.[index]?.fabricType ? ' is-error' : ''}`}
                          type="text"
                          placeholder="VD: Cotton 60/40"
                          {...register(`items.${index}.fabricType`)}
                        />
                        {errors.items?.[index]?.fabricType && (
                          <span className="field-error">
                            {errors.items[index].fabricType.message}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label htmlFor={`items.${index}.colorName`}>Màu</label>
                        <input
                          id={`items.${index}.colorName`}
                          className="field-input"
                          type="text"
                          placeholder="VD: Trắng"
                          {...register(`items.${index}.colorName`)}
                        />
                      </div>
                    </div>

                    <div className="form-grid form-grid-2">
                      <div className="form-field">
                        <label htmlFor={`items.${index}.colorCode`}>Mã màu</label>
                        <input
                          id={`items.${index}.colorCode`}
                          className="field-input"
                          type="text"
                          placeholder="VD: TC-01"
                          {...register(`items.${index}.colorCode`)}
                        />
                      </div>

                      <div className="form-grid form-grid-2">
                        <div className="form-field">
                          <label htmlFor={`items.${index}.widthCm`}>Khổ vải (cm)</label>
                          <input
                            id={`items.${index}.widthCm`}
                            className="field-input"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="150"
                            {...register(`items.${index}.widthCm`, { valueAsNumber: true })}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor={`items.${index}.unit`}>Đơn vị</label>
                          <select
                            id={`items.${index}.unit`}
                            className="field-select"
                            {...register(`items.${index}.unit`)}
                          >
                            {UNIT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="form-grid form-grid-2">
                      <ItemQuantityFields control={control} index={index} register={register} errors={errors} />
                    </div>

                    <div className="form-grid form-grid-2">
                      <div className="form-field">
                        <label htmlFor={`items.${index}.leadTimeDays`}>Thời gian SX (ngày)</label>
                        <input
                          id={`items.${index}.leadTimeDays`}
                          className="field-input"
                          type="number"
                          min="0"
                          placeholder="15"
                          {...register(`items.${index}.leadTimeDays`, { valueAsNumber: true })}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`items.${index}.notes`}>Ghi chú dòng</label>
                        <input
                          id={`items.${index}.notes`}
                          className="field-input"
                          type="text"
                          placeholder="Ghi chú..."
                          {...register(`items.${index}.notes`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-secondary"
                type="button"
                onClick={() => append({ ...emptyQuotationItem })}
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                + Thêm dòng hàng
              </button>
            </div>

            {/* Discount + VAT */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="discountType">Loại chiết khấu</label>
                <select
                  id="discountType"
                  className="field-select"
                  {...register('discountType')}
                >
                  {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="discountValue">Giá trị chiết khấu</label>
                <input
                  id="discountValue"
                  className="field-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  {...register('discountValue', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="vatRate">Thuế VAT</label>
              <select
                id="vatRate"
                className="field-select"
                {...register('vatRate', { valueAsNumber: true })}
              >
                {VAT_RATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Totals summary */}
            <TotalsSummary control={control} />

            {/* Terms */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="deliveryTerms">Điều kiện giao hàng</label>
                <textarea
                  id="deliveryTerms"
                  className="field-input"
                  rows={2}
                  placeholder="VD: Giao tại kho khách..."
                  style={{ resize: 'vertical' }}
                  {...register('deliveryTerms')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="paymentTerms">Điều kiện thanh toán</label>
                <textarea
                  id="paymentTerms"
                  className="field-input"
                  rows={2}
                  placeholder="VD: Thanh toán 50% trước..."
                  style={{ resize: 'vertical' }}
                  {...register('paymentTerms')}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="form-field">
              <label htmlFor="notes">Ghi chú</label>
              <textarea
                id="notes"
                className="field-input"
                rows={2}
                placeholder="Ghi chú về báo giá..."
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
            <button
              className="primary-button"
              type="submit"
              disabled={isPending}
            >
              {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo báo giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
