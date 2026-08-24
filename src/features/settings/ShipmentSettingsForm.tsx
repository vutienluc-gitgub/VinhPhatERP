import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button, Icon, VPSelect } from '@/shared/components';
import {
  shipmentSettingsSchema,
  shipmentSettingsDefaults,
  type ShipmentSettingsFormValues,
} from '@/schema/company-settings.schema';
import {
  useCompanySettings,
  useUpdatePartialSettings,
} from '@/application/settings';

import {
  SETTINGS_LABELS,
  SETTINGS_MESSAGES,
  SETTINGS_PLACEHOLDERS,
  SHIPPING_UNIT_OPTIONS,
  REGION_OPTIONS,
} from './settings.constants';

export function ShipmentSettingsForm() {
  const { data: settings } = useCompanySettings();
  const mutation = useUpdatePartialSettings();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ShipmentSettingsFormValues>({
    resolver: zodResolver(shipmentSettingsSchema),
    defaultValues: shipmentSettingsDefaults,
  });

  useEffect(() => {
    if (settings) {
      reset({
        default_shipping_unit:
          (settings.default_shipping_unit as 'kg' | 'cuon' | 'kien') ||
          shipmentSettingsDefaults.default_shipping_unit,
        default_shipping_region:
          settings.default_shipping_region ||
          shipmentSettingsDefaults.default_shipping_region,
        default_delivery_days:
          settings.default_delivery_days ||
          shipmentSettingsDefaults.default_delivery_days,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: ShipmentSettingsFormValues) {
    await mutation.mutateAsync(values as Record<string, string>);
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info-soft/10 text-info flex items-center justify-center shrink-0">
            <Icon name="Truck" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-bold text-lg text-foreground block">
              {SETTINGS_LABELS.SHIPMENT_TITLE}
            </span>
            <span className="text-xs text-muted">
              {SETTINGS_LABELS.SHIPMENT_SUBTITLE}
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
                htmlFor="sh-unit"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_SHIPPING_UNIT}
              </label>
              <Controller
                name="default_shipping_unit"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    id="sh-unit"
                    options={SHIPPING_UNIT_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={!!errors.default_shipping_unit}
                    className="w-full"
                  />
                )}
              />
              {errors.default_shipping_unit && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_shipping_unit.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="sh-region"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_SHIPPING_REGION}
              </label>
              <Controller
                name="default_shipping_region"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    id="sh-region"
                    options={REGION_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={!!errors.default_shipping_region}
                    className="w-full"
                  />
                )}
              />
              {errors.default_shipping_region && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_shipping_region.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label
                htmlFor="sh-days"
                className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 block"
              >
                {SETTINGS_LABELS.DEFAULT_DELIVERY_DAYS}
              </label>
              <div className="relative flex items-center">
                <input
                  id="sh-days"
                  className={`field-input pr-14 w-full${errors.default_delivery_days ? ' border-danger ring-1 ring-danger' : ''}`}
                  type="text"
                  placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_DELIVERY_DAYS}
                  {...register('default_delivery_days')}
                />
                <span className="pointer-events-none absolute right-3 text-xs font-semibold text-muted select-none">
                  ngày
                </span>
              </div>
              {errors.default_delivery_days && (
                <span className="field-error text-xs text-danger mt-1 block">
                  {errors.default_delivery_days.message}
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
