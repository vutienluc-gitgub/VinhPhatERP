import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import {
  productionSettingsSchema,
  productionSettingsDefaults,
  type ProductionSettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdatePartialSettings,
} from '@/application/settings';

import {
  SETTINGS_LABELS,
  SETTINGS_MESSAGES,
  SETTINGS_PLACEHOLDERS,
  UNIT_OPTIONS,
} from './settings.constants';

export function ProductionSettingsForm() {
  const { data: settings } = useCompanySettings();
  const mutation = useUpdatePartialSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductionSettingsFormValues>({
    resolver: zodResolver(productionSettingsSchema),
    defaultValues: productionSettingsDefaults,
  });

  useEffect(() => {
    if (settings) {
      reset({
        default_unit:
          (settings.default_unit as 'met' | 'yard' | 'kg') ||
          productionSettingsDefaults.default_unit,
        default_waste_rate:
          settings.default_waste_rate ||
          productionSettingsDefaults.default_waste_rate,
        default_production_days:
          settings.default_production_days ||
          productionSettingsDefaults.default_production_days,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: ProductionSettingsFormValues) {
    await mutation.mutateAsync(values as Record<string, string>);
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Icon name="Factory" size={20} strokeWidth={1.5} />
          </div>
          <span className="font-bold text-lg">
            {SETTINGS_LABELS.PRODUCTION_TITLE}
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

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <div className="form-field">
              <label htmlFor="ps-unit">{SETTINGS_LABELS.DEFAULT_UNIT}</label>
              <select
                id="ps-unit"
                className="field-select w-full"
                {...register('default_unit')}
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="ps-waste">
                {SETTINGS_LABELS.DEFAULT_WASTE_RATE}
              </label>
              <input
                id="ps-waste"
                className={`field-input${errors.default_waste_rate ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_WASTE_RATE}
                {...register('default_waste_rate')}
              />
              {errors.default_waste_rate && (
                <span className="field-error">
                  {errors.default_waste_rate.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="ps-days">
                {SETTINGS_LABELS.DEFAULT_PRODUCTION_DAYS}
              </label>
              <input
                id="ps-days"
                className={`field-input${errors.default_production_days ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_PRODUCTION_DAYS}
                {...register('default_production_days')}
              />
              {errors.default_production_days && (
                <span className="field-error">
                  {errors.default_production_days.message}
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
