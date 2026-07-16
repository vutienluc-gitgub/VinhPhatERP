import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CancelButton, Button } from '@/shared/components';
import { createPaymentsSchema } from '@/schema/payment.schema';
import { MoneyText, MoneyInput } from '@/shared/value';
import { useCreatePayment } from '@/application/payments';

import { PAYMENT_FORM_MESSAGES as MSG } from './payments.constants';
import {
  PAYMENT_METHOD_LABELS,
  paymentsDefaultValues,
} from './payments.module';
import type { PaymentsFormValues } from './payments.module';
import type { PaymentMethod } from './types';
import { PAYMENT_FORM_LABELS } from './payments.constants';

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
        title={`${PAYMENT_FORM_LABELS.titlePrefix} ${orderNumber}`}
        footer={
          <CancelButton onClick={onClose} label={PAYMENT_FORM_LABELS.cancel} />
        }
      >
        <div className="p-4 bg-[var(--surface-success)] text-[var(--success-strong)] rounded text-[0.9rem] border border-[var(--success)] text-center">
          {MSG.SUCCESS_FULLY_PAID}
        </div>
      </AdaptiveSheet>
    );
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`${PAYMENT_FORM_LABELS.titlePrefix} ${orderNumber}`}
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || createMutation.isPending}
            className="w-full sm:w-auto justify-center"
          >
            {PAYMENT_FORM_LABELS.cancel}
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="payment-form"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full sm:w-auto justify-center"
          >
            {createMutation.isPending
              ? PAYMENT_FORM_LABELS.submitPending
              : PAYMENT_FORM_LABELS.submitReady}
          </Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit(onSubmit)}>
        {/* Balance due info */}
        {balanceDue > 0 && (
          <div className="p-3 bg-[var(--surface-warning)] text-[var(--warning-strong)] rounded text-[0.88rem] border border-[var(--warning)] mb-4">
            {PAYMENT_FORM_LABELS.balanceDuePrefix}{' '}
            <strong>
              <MoneyText value={balanceDue} />
            </strong>
          </div>
        )}

        {createMutation.error && (
          <p className="error-inline mb-4">
            {PAYMENT_FORM_LABELS.errorPrefix}{' '}
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : String(createMutation.error)}
          </p>
        )}

        <div className="form-grid">
          {/* Payment number + date */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>{PAYMENT_FORM_LABELS.paymentNumber}</label>
              <input
                className="field-input bg-[var(--surface-disabled)] text-[var(--text-tertiary)] italic"
                value={PAYMENT_FORM_LABELS.paymentNumberAuto}
                readOnly
                disabled
              />
            </div>
            <div className="form-field">
              <label>
                {PAYMENT_FORM_LABELS.paymentDate}{' '}
                <span className="field-required">*</span>
              </label>
              <input
                className={`field-input${errors.paymentDate ? ' border-danger' : ''}`}
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
                {PAYMENT_FORM_LABELS.amount}{' '}
                <span className="field-required">*</span>
              </label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    className={`field-input${errors.amount ? ' border-danger' : ''}`}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={PAYMENT_FORM_LABELS.amountPlaceholder}
                  />
                )}
              />
              {errors.amount && (
                <p className="field-error">{errors.amount.message}</p>
              )}
            </div>
            <div className="form-field">
              <label>
                {PAYMENT_FORM_LABELS.paymentMethod}{' '}
                <span className="field-required">*</span>
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
            <label>{PAYMENT_FORM_LABELS.referenceNumber}</label>
            <input
              className="field-input"
              {...register('referenceNumber')}
              placeholder={PAYMENT_FORM_LABELS.referenceNumberPlaceholder}
            />
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
