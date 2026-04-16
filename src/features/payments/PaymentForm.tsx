import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CancelButton } from '@/shared/components';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { createPaymentsSchema } from '@/schema/payment.schema';
import { formatCurrency } from '@/shared/utils/format';
import { useCreatePayment } from '@/application/payments';

import {
  PAYMENT_METHOD_LABELS,
  paymentsDefaultValues,
} from './payments.module';
import type { PaymentsFormValues } from './payments.module';
import type { PaymentMethod } from './types';

type PaymentFormProps = {
  orderId: string;
  customerId: string;
  orderNumber: string;
  balanceDue: number;
  onClose: () => void;
};

export function PaymentForm({
  orderId,
  customerId,
  orderNumber,
  balanceDue,
  onClose,
}: PaymentFormProps) {
  const createMutation = useCreatePayment();

  const schema = useMemo(() => createPaymentsSchema(balanceDue), [balanceDue]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...paymentsDefaultValues,
      orderId,
      customerId,
      amount: balanceDue > 0 ? balanceDue : 0,
    },
  });

  async function onSubmit(values: PaymentsFormValues) {
    await createMutation.mutateAsync(values);
    reset();
    onClose();
  }

  if (balanceDue <= 0) {
    return (
      <AdaptiveSheet
        open={true}
        onClose={onClose}
        title={`Thu tiền — ${orderNumber}`}
      >
        <div
          style={{
            padding: '1rem',
            background: 'var(--surface-success)',
            color: 'var(--success-strong)',
            borderRadius: 'var(--radius)',
            fontSize: '0.9rem',
            border: '1px solid var(--success)',
            textAlign: 'center',
          }}
        >
          ✅ Đơn hàng đã được thanh toán đầy đủ.
        </div>
        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
          }}
        >
          <CancelButton onClick={onClose} label="Đóng" />
        </div>
      </AdaptiveSheet>
    );
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`Thu tiền — ${orderNumber}`}
    >
      <form id="payment-form" onSubmit={handleSubmit(onSubmit)}>
        {/* Balance due info */}
        {balanceDue > 0 && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--surface-warning)',
              color: 'var(--warning-strong)',
              borderRadius: 'var(--radius)',
              fontSize: '0.88rem',
              border: '1px solid var(--warning)',
              marginBottom: '1rem',
            }}
          >
            Còn nợ: <strong>{formatCurrency(balanceDue)} đ</strong>
          </div>
        )}

        {createMutation.error && (
          <p className="error-inline" style={{ marginBottom: '1rem' }}>
            Lỗi: {(createMutation.error as Error).message}
          </p>
        )}

        <div className="form-grid">
          {/* Payment number + date */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Số phiếu thu</label>
              <input
                className="field-input"
                value="Tự động"
                readOnly
                disabled
                style={{
                  background: 'var(--surface-disabled)',
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                }}
              />
            </div>
            <div className="form-field">
              <label>
                Ngày thu <span className="field-required">*</span>
              </label>
              <input
                className={`field-input${errors.paymentDate ? ' is-error' : ''}`}
                type="date"
                {...register('paymentDate')}
              />
              {errors.paymentDate && (
                <p className="field-error">{errors.paymentDate.message}</p>
              )}
            </div>
          </div>

          {/* Amount + method */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>
                Số tiền (đ) <span className="field-required">*</span>
              </label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    className={`field-input${errors.amount ? ' is-error' : ''}`}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 0)}
                    onBlur={field.onBlur}
                    placeholder="VD: 5.000.000"
                  />
                )}
              />
              {errors.amount && (
                <p className="field-error">{errors.amount.message}</p>
              )}
            </div>
            <div className="form-field">
              <label>
                Hình thức <span className="field-required">*</span>
              </label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={(
                      Object.entries(PAYMENT_METHOD_LABELS) as [
                        PaymentMethod,
                        string,
                      ][]
                    ).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.paymentMethod}
                  />
                )}
              />
            </div>
          </div>

          {/* Reference */}
          <div className="form-field">
            <label>Số chứng từ / mã giao dịch</label>
            <input
              className="field-input"
              {...register('referenceNumber')}
              placeholder="Số séc, mã giao dịch..."
            />
          </div>
        </div>

        {/* Actions */}
        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
          }}
        >
          <CancelButton
            onClick={onClose}
            label="Hủy"
            disabled={isSubmitting || createMutation.isPending}
          />
          <button
            className="primary-button btn-standard"
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
          >
            {createMutation.isPending ? 'Đang lưu...' : 'Xác nhận thu'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
