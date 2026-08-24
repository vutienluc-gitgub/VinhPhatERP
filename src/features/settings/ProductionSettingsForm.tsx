import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button, Icon, VPSelect } from '@/shared/components';
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
    control,
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
          <div className="w-10 h-10 rounded-xl bg-info-soft/10 text-info flex items-center justify-center shrink-0">
            <Icon name="Factory" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-bold text-lg text-foreground block">
              {SETTINGS_LABELS.PRODUCTION_TITLE}
            </span>
            <span className="text-xs text-muted">
              {SETTINGS_LABELS.PRODUCTION_SUBTITLE}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="form-field">
              <label
                htmlFor="ps-unit"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_UNIT}
              </label>
              <Controller
                name="default_unit"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    id="ps-unit"
                    options={UNIT_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={!!errors.default_unit}
                    className="w-full"
                  />
                )}
              />
              {errors.default_unit && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_unit.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="ps-waste"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_WASTE_RATE}
              </label>
              <div className="relative flex items-center">
                <input
                  id="ps-waste"
                  className={`field-input pr-9 w-full${errors.default_waste_rate ? ' border-danger ring-1 ring-danger' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_WASTE_RATE}
                  {...register('default_waste_rate')}
                />
                <span className="pointer-events-none absolute right-3 text-xs font-semibold text-muted select-none">
                  %
                </span>
              </div>
              {errors.default_waste_rate && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_waste_rate.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="ps-days"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_PRODUCTION_DAYS}
              </label>
              <div className="relative flex items-center">
                <input
                  id="ps-days"
                  className={`field-input pr-14 w-full${errors.default_production_days ? ' border-danger ring-1 ring-danger' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_PRODUCTION_DAYS}
                  {...register('default_production_days')}
                />
                <span className="pointer-events-none absolute right-3 text-xs font-semibold text-muted select-none">
                  ngày
                </span>
              </div>
              {errors.default_production_days && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_production_days.message}
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
