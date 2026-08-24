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
          <div className="w-10 h-10 rounded-xl bg-warning-soft/10 text-warning flex items-center justify-center shrink-0">
            <Icon name="Hash" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-bold text-lg text-foreground block">
              {SETTINGS_LABELS.NUMBERING_TITLE}
            </span>
            <span className="text-xs text-muted">
              {SETTINGS_LABELS.NUMBERING_SUBTITLE}
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-6"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="form-field">
              <label
                htmlFor="ns-order"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.ORDER_PREFIX}
              </label>
              <input
                id="ns-order"
                className={`field-input w-full${errors.order_prefix ? ' border-danger ring-1 ring-danger' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.ORDER_PREFIX}
                {...register('order_prefix')}
              />
              {errors.order_prefix && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.order_prefix.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="ns-quotation"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.QUOTATION_PREFIX}
              </label>
              <input
                id="ns-quotation"
                className={`field-input w-full${errors.quotation_prefix ? ' border-danger ring-1 ring-danger' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.QUOTATION_PREFIX}
                {...register('quotation_prefix')}
              />
              {errors.quotation_prefix && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.quotation_prefix.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="ns-invoice"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.INVOICE_PREFIX}
              </label>
              <input
                id="ns-invoice"
                className={`field-input w-full${errors.invoice_prefix ? ' border-danger ring-1 ring-danger' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.INVOICE_PREFIX}
                {...register('invoice_prefix')}
              />
              {errors.invoice_prefix && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.invoice_prefix.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="ns-payment"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.PAYMENT_PREFIX}
              </label>
              <input
                id="ns-payment"
                className={`field-input w-full${errors.payment_prefix ? ' border-danger ring-1 ring-danger' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.PAYMENT_PREFIX}
                {...register('payment_prefix')}
              />
              {errors.payment_prefix && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.payment_prefix.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="ns-expense"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.EXPENSE_PREFIX}
              </label>
              <input
                id="ns-expense"
                className={`field-input w-full${errors.expense_prefix ? ' border-danger ring-1 ring-danger' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.EXPENSE_PREFIX}
                {...register('expense_prefix')}
              />
              {errors.expense_prefix && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.expense_prefix.message}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-surface-secondary/30 max-w-lg">
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

          <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
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
