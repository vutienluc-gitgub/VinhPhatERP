import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import {
  PAYMENT_METHOD_LABELS,
  paymentsDefaultValues,
  paymentsSchema,
} from './payments.module'
import type { PaymentsFormValues } from './payments.module'
import type { PaymentMethod } from './types'
import { useCreatePayment, useNextPaymentNumber } from './usePayments'

type PaymentFormProps = {
  orderId: string
  customerId: string
  orderNumber: string
  balanceDue: number
  onClose: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function PaymentForm({ orderId, customerId, orderNumber, balanceDue, onClose }: PaymentFormProps) {
  const { data: nextNumber } = useNextPaymentNumber()
  const createMutation = useCreatePayment()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentsFormValues>({
    resolver: zodResolver(paymentsSchema),
    defaultValues: {
      ...paymentsDefaultValues,
      orderId,
      customerId,
      amount: balanceDue > 0 ? balanceDue : 0,
    },
  })

  useEffect(() => {
    if (nextNumber) setValue('paymentNumber', nextNumber)
  }, [nextNumber, setValue])

  async function onSubmit(values: PaymentsFormValues) {
    await createMutation.mutateAsync(values)
    reset()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>Thu tiền — {orderNumber}</h3>
          <button className="btn-icon" type="button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Balance due info */}
          {balanceDue > 0 && (
            <div style={{ padding: '0.6rem 0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem' }}>
              Còn nợ: <strong style={{ color: '#c0392b' }}>{formatCurrency(balanceDue)} đ</strong>
            </div>
          )}

          {/* Payment number + date */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Số phiếu thu *</label>
              <input className="field-input" {...register('paymentNumber')} readOnly style={{ background: 'var(--surface)' }} />
              {errors.paymentNumber && <p className="field-error">{errors.paymentNumber.message}</p>}
            </div>
            <div>
              <label className="form-label">Ngày thu *</label>
              <input className="field-input" type="date" {...register('paymentDate')} />
              {errors.paymentDate && <p className="field-error">{errors.paymentDate.message}</p>}
            </div>
          </div>

          {/* Amount + method */}
          <div className="form-grid-2">
            <div>
              <label className="form-label">Số tiền (đ) *</label>
              <input
                className="field-input"
                type="number"
                step="1000"
                inputMode="numeric"
                {...register('amount', { valueAsNumber: true })}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
              {errors.amount && <p className="field-error">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="form-label">Hình thức *</label>
              <select className="field-select" {...register('paymentMethod')}>
                {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ),
                )}
              </select>
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="form-label">Số chứng từ / mã giao dịch</label>
            <input className="field-input" {...register('referenceNumber')} placeholder="Số séc, mã giao dịch..." />
          </div>

          {/* Error */}
          {createMutation.error && (
            <p style={{ color: '#c0392b', fontSize: '0.88rem' }}>
              Lỗi: {(createMutation.error as Error).message}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <button className="btn-secondary" type="button" onClick={onClose}>
              Huỷ
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.9rem' }}
            >
              {createMutation.isPending ? 'Đang lưu...' : '💰 Xác nhận thu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
