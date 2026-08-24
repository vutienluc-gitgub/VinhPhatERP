import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button, Icon, VPSelect } from '@/shared/components';
import {
  financeSettingsSchema,
  financeSettingsDefaults,
  type FinanceSettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdatePartialSettings,
} from '@/application/settings';

import {
  SETTINGS_LABELS,
  SETTINGS_MESSAGES,
  SETTINGS_PLACEHOLDERS,
  CURRENCY_OPTIONS,
} from './settings.constants';

export function FinanceSettingsForm() {
  const { data: settings } = useCompanySettings();
  const mutation = useUpdatePartialSettings();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FinanceSettingsFormValues>({
    resolver: zodResolver(financeSettingsSchema),
    defaultValues: financeSettingsDefaults,
  });

  useEffect(() => {
    if (settings) {
      reset({
        default_currency:
          (settings.default_currency as 'VND' | 'USD') ||
          financeSettingsDefaults.default_currency,
        default_vat_rate:
          settings.default_vat_rate || financeSettingsDefaults.default_vat_rate,
        default_payment_terms:
          settings.default_payment_terms ||
          financeSettingsDefaults.default_payment_terms,
        default_credit_limit:
          settings.default_credit_limit ||
          financeSettingsDefaults.default_credit_limit,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: FinanceSettingsFormValues) {
    await mutation.mutateAsync(values as Record<string, string>);
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-soft/10 text-success flex items-center justify-center shrink-0">
            <Icon name="Wallet" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-bold text-lg text-foreground block">
              {SETTINGS_LABELS.FINANCE_TITLE}
            </span>
            <span className="text-xs text-muted">
              {SETTINGS_LABELS.FINANCE_SUBTITLE}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-field">
              <label
                htmlFor="fs-currency"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_CURRENCY}
              </label>
              <Controller
                name="default_currency"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    id="fs-currency"
                    options={CURRENCY_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={!!errors.default_currency}
                    className="w-full"
                  />
                )}
              />
              {errors.default_currency && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_currency.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="fs-vat"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_VAT_RATE}
              </label>
              <div className="relative flex items-center">
                <input
                  id="fs-vat"
                  className={`field-input pr-9 w-full${errors.default_vat_rate ? ' border-danger ring-1 ring-danger' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_VAT_RATE}
                  {...register('default_vat_rate')}
                />
                <span className="pointer-events-none absolute right-3 text-xs font-semibold text-muted select-none">
                  %
                </span>
              </div>
              {errors.default_vat_rate && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_vat_rate.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="fs-payment-terms"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_PAYMENT_TERMS}
              </label>
              <div className="relative flex items-center">
                <input
                  id="fs-payment-terms"
                  className={`field-input pr-14 w-full${errors.default_payment_terms ? ' border-danger ring-1 ring-danger' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_PAYMENT_TERMS}
                  {...register('default_payment_terms')}
                />
                <span className="pointer-events-none absolute right-3 text-xs font-semibold text-muted select-none">
                  ngày
                </span>
              </div>
              {errors.default_payment_terms && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_payment_terms.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="fs-credit-limit"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_CREDIT_LIMIT}
              </label>
              <div className="relative flex items-center">
                <input
                  id="fs-credit-limit"
                  className={`field-input pr-12 w-full${errors.default_credit_limit ? ' border-danger ring-1 ring-danger' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_CREDIT_LIMIT}
                  {...register('default_credit_limit')}
                />
                <span className="pointer-events-none absolute right-3 text-xs font-semibold text-muted select-none">
                  VNĐ
                </span>
              </div>
              {errors.default_credit_limit && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_credit_limit.message}
                </span>
              )}
            </div>
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
