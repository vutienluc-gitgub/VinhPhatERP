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
            Tên bảng giá <span className="field-required">*</span>
          </label>
          <input
            className={`field-input${errors.name ? ' border-danger' : ''}`}
            {...register('name')}
            placeholder="VD: Tuyến HCM - Bình Dương"
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        {/* Area */}
        <div className="form-field">
          <label>
            Khu vực giao <span className="field-required">*</span>
          </label>
          <input
            className={`field-input${errors.destinationArea ? ' border-danger' : ''}`}
            {...register('destinationArea')}
            placeholder="VD: Bình Dương"
          />
          {errors.destinationArea && (
            <p className="field-error">{errors.destinationArea.message}</p>
          )}
        </div>

        {/* Rate per trip */}
        <div className="form-field">
          <label>Giá cố định/chuyến (VNĐ)</label>
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
                suffix=" đ/chuyến"
              />
            )}
          />
          {errors.ratePerTrip && (
            <p className="field-error">{errors.ratePerTrip.message}</p>
          )}
        </div>

        {/* Rate per meter */}
        <div className="form-field">
          <label>Giá theo mét (VNĐ/m)</label>
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
                suffix=" đ/m"
              />
            )}
          />
          {errors.ratePerMeter && (
            <p className="field-error">{errors.ratePerMeter.message}</p>
          )}
        </div>

        {/* Rate per kg */}
        <div className="form-field">
          <label>Giá theo kg (VNĐ/kg)</label>
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
                suffix=" đ/kg"
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
            Phí bốc xếp (VNĐ) <span className="field-required">*</span>
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
                suffix=" đ"
              />
            )}
          />
          {errors.loadingFee && (
            <p className="field-error">{errors.loadingFee.message}</p>
          )}
        </div>

        {/* Min charge */}
        <div className="form-field">
          <label>Phí tối thiểu (VNĐ)</label>
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
                suffix=" đ"
              />
            )}
          />
          {errors.minCharge && (
            <p className="field-error">{errors.minCharge.message}</p>
          )}
        </div>

        {/* Active status */}
        <div className="form-field">
          <label>Trạng thái</label>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Combobox
                options={[
                  {
                    value: 'true',
                    label: 'Đang dùng',
                  },
                  {
                    value: 'false',
                    label: 'Ngừng dùng',
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
        <label>Ghi chú</label>
        <textarea
          className="field-textarea"
          rows={2}
          {...register('notes')}
          placeholder="Ghi chú thêm..."
        />
      </div>

      {/* Error display */}
      {mutationError && (
        <p className="error-inline mt-4">
          Lỗi: {getErrorMessage(mutationError)}
        </p>
      )}

      {/* Footer is handled by AdaptiveSheet via portal props, but we keep buttons for convenience if not using footer prop */}
      <div className="modal-footer mt-6 p-0 border-none">
        <CancelButton onClick={onClose} label="Hủy" />
        <button
          className="primary-button btn-standard"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang lưu...' : item ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}
