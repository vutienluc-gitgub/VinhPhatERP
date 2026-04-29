import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
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
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <Icon name="Truck" size={20} strokeWidth={1.5} />
          </div>
          <span className="font-bold text-lg">
            {SETTINGS_LABELS.SHIPMENT_TITLE}
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
              <label htmlFor="sh-unit">
                {SETTINGS_LABELS.DEFAULT_SHIPPING_UNIT}
              </label>
              <select
                id="sh-unit"
                className="field-select w-full"
                {...register('default_shipping_unit')}
              >
                {SHIPPING_UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="sh-region">
                {SETTINGS_LABELS.DEFAULT_SHIPPING_REGION}
              </label>
              <select
                id="sh-region"
                className="field-select w-full"
                {...register('default_shipping_region')}
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="sh-days">
                {SETTINGS_LABELS.DEFAULT_DELIVERY_DAYS}
              </label>
              <input
                id="sh-days"
                className={`field-input${errors.default_delivery_days ? ' is-error' : ''}`}
                type="text"
                placeholder={SETTINGS_PLACEHOLDERS.DEFAULT_DELIVERY_DAYS}
                {...register('default_delivery_days')}
              />
              {errors.default_delivery_days && (
                <span className="field-error">
                  {errors.default_delivery_days.message}
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
