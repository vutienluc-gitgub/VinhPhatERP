import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import { Switch } from '@/shared/components/Switch';
import {
  numberingSettingsSchema,
  numberingSettingsDefaults,
  type NumberingSettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdatePartialSettings,
} from '@/application/settings';

import {
  SETTINGS_LABELS,
  SETTINGS_MESSAGES,
  SETTINGS_PLACEHOLDERS,
} from './settings.constants';

export function NumberingSettingsForm() {
  const { data: settings } = useCompanySettings();
  const mutation = useUpdatePartialSettings();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NumberingSettingsFormValues>({
    resolver: zodResolver(numberingSettingsSchema),
    defaultValues: numberingSettingsDefaults,
  });

  const resetYearly = watch('numbering_reset_yearly');

  useEffect(() => {
    if (settings) {
      reset({
        order_prefix:
          settings.order_prefix || numberingSettingsDefaults.order_prefix,
        quotation_prefix:
          settings.quotation_prefix ||
          numberingSettingsDefaults.quotation_prefix,
        invoice_prefix:
          settings.invoice_prefix || numberingSettingsDefaults.invoice_prefix,
        payment_prefix:
          settings.payment_prefix || numberingSettingsDefaults.payment_prefix,
        expense_prefix:
          settings.expense_prefix || numberingSettingsDefaults.expense_prefix,
        numbering_reset_yearly:
          (settings.numbering_reset_yearly as 'true' | 'false') ||
          numberingSettingsDefaults.numbering_reset_yearly,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: NumberingSettingsFormValues) {
    await mutation.mutateAsync(values as Record<string, string>);
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Icon name="Hash" size={20} strokeWidth={1.5} />
          </div>
          <span className="font-bold text-lg">
            {SETTINGS_LABELS.NUMBERING_TITLE}
          </span>
        </div>
      </div>
      <div className="p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="form-grid gap-4"
        >
          {mutation.isSuccess && (
            <div className="success-inline">
              <Icon name="CheckCircle2" size={16} strokeWidth={2} />
              {SETTINGS_MESSAGES.SAVE_SUCCESS}
            </div>
          )}

          {mutation.error && (
            <p className="error-inline">
              {SETTINGS_MESSAGES.SAVE_ERROR}{' '}
              {mutation.error instanceof Error
                ? mutation.error.message
                : String(mutation.error)}
            </p>
          )}

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <div className="form-field">
              <label htmlFor="ns-order">{SETTINGS_LABELS.ORDER_PREFIX}</label>
              <input
                id="ns-order"
                className={`field-input${errors.order_prefix ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.ORDER_PREFIX}
                {...register('order_prefix')}
              />
              {errors.order_prefix && (
                <span className="field-error">
                  {errors.order_prefix.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="ns-quotation">
                {SETTINGS_LABELS.QUOTATION_PREFIX}
              </label>
              <input
                id="ns-quotation"
                className={`field-input${errors.quotation_prefix ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.QUOTATION_PREFIX}
                {...register('quotation_prefix')}
              />
              {errors.quotation_prefix && (
                <span className="field-error">
                  {errors.quotation_prefix.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="ns-invoice">
                {SETTINGS_LABELS.INVOICE_PREFIX}
              </label>
              <input
                id="ns-invoice"
                className={`field-input${errors.invoice_prefix ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.INVOICE_PREFIX}
                {...register('invoice_prefix')}
              />
              {errors.invoice_prefix && (
                <span className="field-error">
                  {errors.invoice_prefix.message}
                </span>
              )}
            </div>
          </div>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <div className="form-field">
              <label htmlFor="ns-payment">
                {SETTINGS_LABELS.PAYMENT_PREFIX}
              </label>
              <input
                id="ns-payment"
                className={`field-input${errors.payment_prefix ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.PAYMENT_PREFIX}
                {...register('payment_prefix')}
              />
              {errors.payment_prefix && (
                <span className="field-error">
                  {errors.payment_prefix.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="ns-expense">
                {SETTINGS_LABELS.EXPENSE_PREFIX}
              </label>
              <input
                id="ns-expense"
                className={`field-input${errors.expense_prefix ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.EXPENSE_PREFIX}
                {...register('expense_prefix')}
              />
              {errors.expense_prefix && (
                <span className="field-error">
                  {errors.expense_prefix.message}
                </span>
              )}
            </div>
          </div>

          <div className="max-w-lg">
            <Switch
              id="ns-reset-yearly"
              checked={resetYearly === 'true'}
              onChange={(val) =>
                setValue('numbering_reset_yearly', val ? 'true' : 'false', {
                  shouldDirty: true,
                })
              }
              label={SETTINGS_LABELS.NUMBERING_RESET_YEARLY}
              description={SETTINGS_LABELS.NUMBERING_RESET_YEARLY_DESC}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              disabled={isSubmitting || !isDirty}
              onClick={() => settings && reset()}
            >
              {SETTINGS_LABELS.BTN_UNDO}
            </Button>
            <button
              className="primary-button btn-standard"
              type="submit"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting
                ? SETTINGS_LABELS.BTN_SAVING
                : SETTINGS_LABELS.BTN_SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
