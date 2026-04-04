import { useActiveCustomers } from '@/shared/hooks/useActiveCustomers'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatCurrency } from '@/shared/utils/format'
import { useEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import {
  emptyOrderItem,
  ordersDefaultValues,
  ordersSchema,
  UNIT_OPTIONS,
} from './orders.module'
import type { OrdersFormValues } from './orders.module'
import type { Order } from './types'
import {
  useNextOrderNumber,
  useUpdateOrder,
} from './useOrders'
import { useCreateOrderV2, isCreditWarning, type CreateOrderError, type CreateOrderInput } from './useCreateOrderV2'
import { CreditOverrideDialog } from './CreditOverrideDialog'
import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'

const UNIT_LABELS: Record<string, string> = { m: 'm', kg: 'kg' }

type OrderFormProps = {
  order: Order | null
  onClose: () => void
}

function orderToFormValues(order: Order): OrdersFormValues {
  return {
    orderNumber: order.order_number,
    customerId: order.customer_id,
    orderDate: order.order_date,
    deliveryDate: order.delivery_date ?? '',
    notes: order.notes ?? '',
    items: (order.order_items ?? []).map((it) => ({
      fabricType: it.fabric_type,
      colorName: it.color_name ?? '',
      colorCode: it.color_code ?? '',
      unit: (it.unit === 'kg' ? 'kg' : 'm') as 'm' | 'kg',
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
    })),
  }
}



/* ── Realtime totals ── */

function LineTotals({ control }: { control: ReturnType<typeof useForm<OrdersFormValues>>['control'] }) {
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

/* ── Quantity + Unit Price with dynamic unit label ── */

type ItemFieldsProps = {
  control: ReturnType<typeof useForm<OrdersFormValues>>['control']
  index: number
  register: ReturnType<typeof useForm<OrdersFormValues>>['register']
  errors: ReturnType<typeof useForm<OrdersFormValues>>['formState']['errors']
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

export function OrderForm({ order, onClose }: OrderFormProps) {
  const isEditing = order !== null
  const { profile } = useAuth()
  const [overrideWarning, setOverrideWarning] = useState<CreateOrderError | null>(null)

  const createMutationV2 = useCreateOrderV2()
  const updateMutation = useUpdateOrder()
  const { data: nextNumber } = useNextOrderNumber()
  const { data: customers = [] } = useActiveCustomers()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrdersFormValues>({
    resolver: zodResolver(ordersSchema),
    defaultValues: isEditing
      ? orderToFormValues(order)
      : ordersDefaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  useEffect(() => {
    reset(isEditing ? orderToFormValues(order) : ordersDefaultValues)
  }, [order, isEditing, reset])

  useEffect(() => {
    if (!isEditing && nextNumber) {
      setValue('orderNumber', nextNumber)
    }
  }, [isEditing, nextNumber, setValue])

  async function onSubmit(values: OrdersFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: order.id, values })
        onClose()
      } else {
        await createMutationV2.mutateAsync(values)
        onClose()
      }
    } catch (err) {
      if (!isEditing && err && typeof err === 'object' && 'code' in err) {
        const e = err as CreateOrderError
        if (isCreditWarning(e.code)) {
          setOverrideWarning(e)
        } else {
          // Error handled via mutationError
        }
      }
    }
  }

  async function handleOverride() {
    try {
      if (overrideWarning) {
        const values = control._formValues as OrdersFormValues
        await createMutationV2.mutateAsync({ ...values, managerOverride: true } as CreateOrderInput)
        setOverrideWarning(null)
        onClose()
      }
    } catch (err) {
      // Error handled via mutationError
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutationV2.error
  const isPending =
    isSubmitting || createMutationV2.isPending || updateMutation.isPending

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
              ? `Sửa đơn: ${order.order_number}`
              : 'Tạo đơn hàng mới'}
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
            {/* Số đơn + Ngày đặt */}
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label htmlFor="orderNumber">
                  Số đơn hàng <span className="field-required">*</span>
                </label>
                <input
                  id="orderNumber"
                  className={`field-input${errors.orderNumber ? ' is-error' : ''}`}
                  type="text"
                  readOnly={!isEditing}
                  {...register('orderNumber')}
                />
                {errors.orderNumber && (
                  <span className="field-error">{errors.orderNumber.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="orderDate">
                  Ngày đặt hàng <span className="field-required">*</span>
                </label>
                <input
                  id="orderDate"
                  className={`field-input${errors.orderDate ? ' is-error' : ''}`}
                  type="date"
                  {...register('orderDate')}
                />
                {errors.orderDate && (
                  <span className="field-error">{errors.orderDate.message}</span>
                )}
              </div>
            </div>

            {/* Khách hàng */}
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

            {/* Ngày giao dự kiến */}
            <div className="form-field">
              <label htmlFor="deliveryDate">Ngày giao dự kiến</label>
              <input
                id="deliveryDate"
                className={`field-input${errors.deliveryDate ? ' is-error' : ''}`}
                type="date"
                {...register('deliveryDate')}
              />
              {errors.deliveryDate && (
                <span className="field-error">{errors.deliveryDate.message}</span>
              )}
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

                    <div className="form-grid form-grid-2">
                      <ItemQuantityFields control={control} index={index} register={register} errors={errors} />
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-secondary"
                type="button"
                onClick={() => append({ ...emptyOrderItem })}
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                + Thêm dòng hàng
              </button>

              <LineTotals control={control} />
            </div>

            {/* Ghi chú */}
            <div className="form-field">
              <label htmlFor="notes">Ghi chú</label>
              <textarea
                id="notes"
                className="field-input"
                rows={3}
                placeholder="Ghi chú về đơn hàng..."
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
              {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo đơn'}
            </button>
          </div>
        </form>
      </div>

      <CreditOverrideDialog
        open={!!overrideWarning}
        code={overrideWarning?.code || 'CREDIT_LIMIT_EXCEEDED'}
        message={overrideWarning?.message || ''}
        detail={overrideWarning?.detail}
        userRole={profile?.role || 'staff'}
        onConfirm={handleOverride}
        onCancel={() => setOverrideWarning(null)}
        isLoading={createMutationV2.isPending}
      />
    </div>
  )
}
