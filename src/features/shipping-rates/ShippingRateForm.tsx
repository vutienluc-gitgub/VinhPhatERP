import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import {
  shippingRatesSchema,
  shippingRatesDefaultValues,
  type ShippingRateFormValues,
  type ShippingRate,
} from '@/schema';
import { Combobox } from '@/shared/components/Combobox';
import { MoneyInput } from '@/shared/value';
import { CancelButton } from '@/shared/components';
import {
  useCreateShippingRate,
  useUpdateShippingRate,
} from '@/application/shipments';
import { getErrorMessage } from '@/shared/utils/error';

import { SHIPPING_RATE_LABELS } from './shipping-rates.constants';

type Props = {
  item: ShippingRate | null;
  onClose: () => void;
};

export function ShippingRateForm({ item, onClose }: Props) {
  const create = useCreateShippingRate();
  const update = useUpdateShippingRate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRatesSchema),
    defaultValues: item
      ? {
          name: item.name,
          destinationArea: item.destination_area,
          ratePerTrip: item.rate_per_trip,
          ratePerMeter: item.rate_per_meter,
          ratePerKg: item.rate_per_kg,
          loadingFee: item.loading_fee,
          minCharge: item.min_charge,
          isActive: item.is_active,
          notes: item.notes ?? '',
        }
      : shippingRatesDefaultValues,
  });

  async function onSubmit(values: ShippingRateFormValues) {
    try {
      if (item) {
        await update.mutateAsync({
          id: item.id,
          values,
        });
      } else {
        await create.mutateAsync(values);
      }
      onClose();
    } catch {
      // mutationError (line ~65) renders the error message in UI automatically
    }
  }

  const mutationError = create.error || update.error;

  return (
    <form id="shipping-rate-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {/* Name */}
        <div className="form-field">
          <label>
            {SHIPPING_RATE_LABELS.FORM_NAME}{' '}
            <span className="field-required">*</span>
          </label>
          <input
            className={`field-input${errors.name ? ' border-danger' : ''}`}
            {...register('name')}
            placeholder={SHIPPING_RATE_LABELS.PLACEHOLDER_NAME}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        {/* Area */}
        <div className="form-field">
          <label>
            {SHIPPING_RATE_LABELS.FORM_AREA}{' '}
            <span className="field-required">*</span>
          </label>
          <input
            className={`field-input${errors.destinationArea ? ' border-danger' : ''}`}
            {...register('destinationArea')}
            placeholder={SHIPPING_RATE_LABELS.PLACEHOLDER_AREA}
          />
          {errors.destinationArea && (
            <p className="field-error">{errors.destinationArea.message}</p>
          )}
        </div>

        {/* Rate per trip */}
        <div className="form-field">
          <label>{SHIPPING_RATE_LABELS.FORM_RATE_TRIP}</label>
          <Controller
            name="ratePerTrip"
            control={control}
            render={({ field }) => (
              <MoneyInput
                className={`field-input${errors.ratePerTrip ? ' border-danger' : ''}`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                suffix={SHIPPING_RATE_LABELS.SUFFIX_TRIP}
              />
            )}
          />
          {errors.ratePerTrip && (
            <p className="field-error">{errors.ratePerTrip.message}</p>
          )}
        </div>

        {/* Rate per meter */}
        <div className="form-field">
          <label>{SHIPPING_RATE_LABELS.FORM_RATE_METER}</label>
          <Controller
            name="ratePerMeter"
            control={control}
            render={({ field }) => (
              <MoneyInput
                className={`field-input${errors.ratePerMeter ? ' border-danger' : ''}`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                suffix={SHIPPING_RATE_LABELS.SUFFIX_METER}
              />
            )}
          />
          {errors.ratePerMeter && (
            <p className="field-error">{errors.ratePerMeter.message}</p>
          )}
        </div>

        {/* Rate per kg */}
        <div className="form-field">
          <label>{SHIPPING_RATE_LABELS.FORM_RATE_KG}</label>
          <Controller
            name="ratePerKg"
            control={control}
            render={({ field }) => (
              <MoneyInput
                className={`field-input${errors.ratePerKg ? ' border-danger' : ''}`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                suffix={SHIPPING_RATE_LABELS.SUFFIX_KG}
              />
            )}
          />
          {errors.ratePerKg && (
            <p className="field-error">{errors.ratePerKg.message}</p>
          )}
        </div>

        {/* Loading fee */}
        <div className="form-field">
          <label>
            {SHIPPING_RATE_LABELS.FORM_LOADING_FEE}{' '}
            <span className="field-required">*</span>
          </label>
          <Controller
            name="loadingFee"
            control={control}
            render={({ field }) => (
              <MoneyInput
                className={`field-input${errors.loadingFee ? ' border-danger' : ''}`}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                onBlur={field.onBlur}
                placeholder="0"
                suffix={SHIPPING_RATE_LABELS.SUFFIX_VND}
              />
            )}
          />
          {errors.loadingFee && (
            <p className="field-error">{errors.loadingFee.message}</p>
          )}
        </div>

        {/* Min charge */}
        <div className="form-field">
          <label>{SHIPPING_RATE_LABELS.FORM_MIN_CHARGE}</label>
          <Controller
            name="minCharge"
            control={control}
            render={({ field }) => (
              <MoneyInput
                className={`field-input${errors.minCharge ? ' border-danger' : ''}`}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                onBlur={field.onBlur}
                placeholder="0"
                suffix={SHIPPING_RATE_LABELS.SUFFIX_VND}
              />
            )}
          />
          {errors.minCharge && (
            <p className="field-error">{errors.minCharge.message}</p>
          )}
        </div>

        {/* Active status */}
        <div className="form-field">
          <label>{SHIPPING_RATE_LABELS.FORM_STATUS}</label>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Combobox
                options={[
                  {
                    value: 'true',
                    label: SHIPPING_RATE_LABELS.STATUS_ACTIVE,
                  },
                  {
                    value: 'false',
                    label: SHIPPING_RATE_LABELS.STATUS_INACTIVE,
                  },
                ]}
                value={String(field.value)}
                onChange={(val) => field.onChange(val === 'true')}
              />
            )}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="form-field mt-4">
        <label>{SHIPPING_RATE_LABELS.FORM_NOTES}</label>
        <textarea
          className="field-textarea"
          rows={2}
          {...register('notes')}
          placeholder={SHIPPING_RATE_LABELS.PLACEHOLDER_NOTES}
        />
      </div>

      {/* Error display */}
      {mutationError && (
        <p className="error-inline mt-4">
          {SHIPPING_RATE_LABELS.ERROR_PREFIX} {getErrorMessage(mutationError)}
        </p>
      )}

      {/* Footer is handled by AdaptiveSheet via portal props, but we keep buttons for convenience if not using footer prop */}
      <div className="modal-footer mt-6 p-0 border-none">
        <CancelButton
          onClick={onClose}
          label={SHIPPING_RATE_LABELS.BTN_CANCEL}
        />
        <button
          className="primary-button btn-standard"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? SHIPPING_RATE_LABELS.BTN_SAVING
            : item
              ? SHIPPING_RATE_LABELS.BTN_UPDATE
              : SHIPPING_RATE_LABELS.BTN_CREATE}
        </button>
      </div>
    </form>
  );
}
