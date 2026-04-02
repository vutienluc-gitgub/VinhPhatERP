import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import {
  emptyItem,
  yarnReceiptsDefaultValues,
  yarnReceiptsSchema,
} from './yarn-receipts.module'
import type { YarnReceiptsFormValues } from './yarn-receipts.module'
import type { YarnReceipt } from './types'
import {
  useActiveSuppliers,
  useCreateYarnReceipt,
  useNextReceiptNumber,
  useUpdateYarnReceipt,
} from './useYarnReceipts'
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

type YarnReceiptFormProps = {
  receipt: YarnReceipt | null
  onClose: () => void
}

function receiptToFormValues(receipt: YarnReceipt): YarnReceiptsFormValues {
  return {
    receiptNumber: receipt.receipt_number,
    supplierId: receipt.supplier_id,
    receiptDate: receipt.receipt_date,
    notes: receipt.notes ?? '',
    items: (receipt.yarn_receipt_items ?? []).map((it) => ({
      yarnType: it.yarn_type,
      colorName: it.color_name ?? '',
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
      lotNumber: it.lot_number ?? '',
      tensileStrength: it.tensile_strength ?? '',
      composition: it.composition ?? '',
      origin: it.origin ?? '',
    })),
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

/* ── Realtime totals sub-component ── */

function LineTotals({ control }: { control: ReturnType<typeof useForm<YarnReceiptsFormValues>>['control'] }) {
  const items = useWatch({ control, name: 'items' })
  const total = (items ?? []).reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  )
  return (
    <div
      style={{
        textAlign: 'right',
        fontWeight: 600,
        fontSize: '1rem',
        padding: '0.6rem 0',
        borderTop: '2px solid var(--border)',
      }}
    >
      Tổng cộng: {formatCurrency(total)} đ
    </div>
  )
}

export function YarnReceiptForm({ receipt, onClose }: YarnReceiptFormProps) {
  const isEditing = receipt !== null
  const [showQuickSupplier, setShowQuickSupplier] = useState(false)
  const createMutation = useCreateYarnReceipt()
  const updateMutation = useUpdateYarnReceipt()
  const { data: nextNumber } = useNextReceiptNumber()
  const { data: suppliers = [] } = useActiveSuppliers()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<YarnReceiptsFormValues>({
    resolver: zodResolver(yarnReceiptsSchema),
    defaultValues: isEditing
      ? receiptToFormValues(receipt)
      : yarnReceiptsDefaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  useEffect(() => {
    reset(isEditing ? receiptToFormValues(receipt) : yarnReceiptsDefaultValues)
  }, [receipt, isEditing, reset])

  useEffect(() => {
    if (!isEditing && nextNumber) {
      setValue('receiptNumber', nextNumber)
    }
  }, [isEditing, nextNumber, setValue])

  async function onSubmit(values: YarnReceiptsFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: receipt.id, values })
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
        style={{ maxWidth: 720 }}
      >
        <div className="modal-header">
          <h3 id="modal-title">
            {isEditing
              ? `Sửa phiếu: ${receipt.receipt_number}`
              : 'Tạo phiếu nhập sợi'}
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
          <p
            style={{
              color: '#c0392b',
              fontSize: '0.88rem',
              marginBottom: '0.75rem',
            }}
          >
            Lỗi: {(mutationError as Error).message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            {/* ── Section 1: Thông tin phiếu ── */}
            <FormSection title="Thông tin phiếu" defaultOpen={true}>
              <div className="form-grid">
                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor="receiptNumber">
                      Số phiếu <span className="field-required">*</span>
                    </label>
                    <input
                      id="receiptNumber"
                      className={`field-input${errors.receiptNumber ? ' is-error' : ''}`}
                      type="text"
                      placeholder="VD: NS-001"
                      readOnly={!isEditing}
                      {...register('receiptNumber')}
                    />
                    {errors.receiptNumber && (
                      <span className="field-error">
                        {errors.receiptNumber.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="receiptDate">
                      Ngày nhập <span className="field-required">*</span>
                    </label>
                    <input
                      id="receiptDate"
                      className={`field-input${errors.receiptDate ? ' is-error' : ''}`}
                      type="date"
                      {...register('receiptDate')}
                    />
                    {errors.receiptDate && (
                      <span className="field-error">
                        {errors.receiptDate.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="supplierId">
                    Nhà cung cấp <span className="field-required">*</span>
                  </label>
                  <select
                    id="supplierId"
                    className={`field-select${errors.supplierId ? ' is-error' : ''}`}
                    {...register('supplierId')}
                  >
                    <option value="">— Chọn nhà cung cấp —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <span className="field-error">{errors.supplierId.message}</span>
                  )}
                  {!showQuickSupplier && (
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => setShowQuickSupplier(true)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem', alignSelf: 'flex-start' }}
                    >
                      + Tạo NCC mới
                    </button>
                  )}
                  {showQuickSupplier && (
                    <QuickSupplierForm
                      defaultCategory="yarn"
                      onCreated={(created) => {
                        setValue('supplierId', created.id)
                        setShowQuickSupplier(false)
                      }}
                      onCancel={() => setShowQuickSupplier(false)}
                    />
                  )}
                </div>
              </div>
            </FormSection>

            {/* ── Section 2: Danh sách sợi ── */}
            <FormSection title="Danh sách sợi" defaultOpen={true}>
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
                      position: 'relative',
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
                        <label htmlFor={`items.${index}.yarnType`}>
                          Loại sợi <span className="field-required">*</span>
                        </label>
                        <input
                          id={`items.${index}.yarnType`}
                          className={`field-input${errors.items?.[index]?.yarnType ? ' is-error' : ''}`}
                          type="text"
                          placeholder="VD: Cotton 40/1"
                          {...register(`items.${index}.yarnType`)}
                        />
                        {errors.items?.[index]?.yarnType && (
                          <span className="field-error">
                            {errors.items[index].yarnType.message}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label htmlFor={`items.${index}.colorName`}>Màu sợi</label>
                        <input
                          id={`items.${index}.colorName`}
                          className="field-input"
                          type="text"
                          placeholder="VD: Trắng ngà"
                          {...register(`items.${index}.colorName`)}
                        />
                      </div>
                    </div>

                    <div className="form-grid form-grid-2">
                      <div className="form-field">
                        <label htmlFor={`items.${index}.quantity`}>
                          Số lượng (kg) <span className="field-required">*</span>
                        </label>
                        <input
                          id={`items.${index}.quantity`}
                          className={`field-input${errors.items?.[index]?.quantity ? ' is-error' : ''}`}
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="0"
                          {...register(`items.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.items?.[index]?.quantity && (
                          <span className="field-error">
                            {errors.items[index].quantity.message}
                          </span>
                        )}
                      </div>

                      <div className="form-field">
                        <label htmlFor={`items.${index}.unitPrice`}>
                          Đơn giá <span className="field-required">*</span>
                        </label>
                        <input
                          id={`items.${index}.unitPrice`}
                          className={`field-input${errors.items?.[index]?.unitPrice ? ' is-error' : ''}`}
                          type="number"
                          step="1"
                          min="0"
                          placeholder="0"
                          {...register(`items.${index}.unitPrice`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.items?.[index]?.unitPrice && (
                          <span className="field-error">
                            {errors.items[index].unitPrice.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-grid form-grid-2">
                      <div className="form-field">
                        <label htmlFor={`items.${index}.lotNumber`}>Số lô (Lot)</label>
                        <input
                          id={`items.${index}.lotNumber`}
                          className="field-input"
                          type="text"
                          placeholder="VD: LOT-2026-03-A"
                          {...register(`items.${index}.lotNumber`)}
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor={`items.${index}.tensileStrength`}>Cường lực</label>
                        <input
                          id={`items.${index}.tensileStrength`}
                          className="field-input"
                          type="text"
                          placeholder="VD: 18 cN/tex"
                          {...register(`items.${index}.tensileStrength`)}
                        />
                      </div>
                    </div>

                    <div className="form-grid form-grid-2">
                      <div className="form-field">
                        <label htmlFor={`items.${index}.composition`}>Thành phần</label>
                        <input
                          id={`items.${index}.composition`}
                          className="field-input"
                          type="text"
                          placeholder="VD: 100% Cotton"
                          {...register(`items.${index}.composition`)}
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor={`items.${index}.origin`}>Xuất xứ</label>
                        <input
                          id={`items.${index}.origin`}
                          className="field-input"
                          type="text"
                          placeholder="VD: Việt Nam"
                          {...register(`items.${index}.origin`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-secondary"
                type="button"
                onClick={() => append({ ...emptyItem })}
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                + Thêm dòng sợi
              </button>

              <LineTotals control={control} />
            </FormSection>

            {/* ── Section 3: Ghi chú ── */}
            <FormSection title="Ghi chú" defaultOpen={false}>
              <div className="form-grid">
                <div className="form-field">
                  <textarea
                    id="notes"
                    className="field-input"
                    rows={3}
                    placeholder="Ghi chú về phiếu nhập..."
                    style={{ resize: 'vertical' }}
                    {...register('notes')}
                  />
                </div>
              </div>
            </FormSection>
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
              {isPending
                ? 'Đang lưu...'
                : isEditing
                  ? 'Cập nhật'
                  : 'Tạo phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
