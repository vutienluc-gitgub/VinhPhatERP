import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CancelButton, Button } from '@/shared/components';
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
        <div className="p-4 bg-[var(--surface-success)] text-[var(--success-strong)] rounded text-[0.9rem] border border-[var(--success)] text-center">
          ✅ Đơn hàng đã được thanh toán đầy đủ.
        </div>
        <div className="modal-footer mt-6 p-0 border-none">
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
          <div className="p-3 bg-[var(--surface-warning)] text-[var(--warning-strong)] rounded text-[0.88rem] border border-[var(--warning)] mb-4">
            Còn nợ: <strong>{formatCurrency(balanceDue)} đ</strong>
          </div>
        )}

        {createMutation.error && (
          <p className="error-inline mb-4">
            Lỗi: {(createMutation.error as Error).message}
          </p>
        )}

        <div className="form-grid">
          {/* Payment number + date */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>Số phiếu thu</label>
              <input
                className="field-input bg-[var(--surface-disabled)] text-[var(--text-tertiary)] italic"
                value="Tự động"
                readOnly
                disabled
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
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
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
        <div className="mt-8 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || createMutation.isPending}
            className="w-full sm:w-auto justify-center"
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full sm:w-auto justify-center"
          >
            {createMutation.isPending ? 'Đang lưu...' : 'Xác nhận thu'}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
