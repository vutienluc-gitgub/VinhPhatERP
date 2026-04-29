import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
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
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Icon name="Wallet" size={20} strokeWidth={1.5} />
          </div>
          <span className="font-bold text-lg">
            {SETTINGS_LABELS.FINANCE_TITLE}
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

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div className="form-field">
              <label htmlFor="fs-currency">
                {SETTINGS_LABELS.DEFAULT_CURRENCY}
              </label>
              <select
                id="fs-currency"
                className="field-select w-full"
                {...register('default_currency')}
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="fs-vat">{SETTINGS_LABELS.DEFAULT_VAT_RATE}</label>
              <input
                id="fs-vat"
                className={`field-input${errors.default_vat_rate ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_VAT_RATE}
                {...register('default_vat_rate')}
              />
              {errors.default_vat_rate && (
                <span className="field-error">
                  {errors.default_vat_rate.message}
                </span>
              )}
            </div>
          </div>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div className="form-field">
              <label htmlFor="fs-payment-terms">
                {SETTINGS_LABELS.DEFAULT_PAYMENT_TERMS}
              </label>
              <input
                id="fs-payment-terms"
                className={`field-input${errors.default_payment_terms ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_PAYMENT_TERMS}
                {...register('default_payment_terms')}
              />
              {errors.default_payment_terms && (
                <span className="field-error">
                  {errors.default_payment_terms.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="fs-credit-limit">
                {SETTINGS_LABELS.DEFAULT_CREDIT_LIMIT}
              </label>
              <input
                id="fs-credit-limit"
                className={`field-input${errors.default_credit_limit ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_CREDIT_LIMIT}
                {...register('default_credit_limit')}
              />
              {errors.default_credit_limit && (
                <span className="field-error">
                  {errors.default_credit_limit.message}
                </span>
              )}
            </div>
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
