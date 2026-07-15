import type { UseFormRegister, FieldErrors } from 'react-hook-form';

import type { BulkFinishedInputFormValues } from '@/schema/finished-fabric.schema';

type FinishedFabricBulkFormStep1ConfigProps = {
  register: UseFormRegister<BulkFinishedInputFormValues>;
  errors: FieldErrors<BulkFinishedInputFormValues>;
};

export function FinishedFabricBulkFormStep1Config({
  register,
  errors,
}: FinishedFabricBulkFormStep1ConfigProps) {
  return (
    <fieldset className="bulk-section">
      <legend>Cấu hình mã cuộn tự động</legend>
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="bulk_roll_prefix">
            Tiền tố mã cuộn <span className="field-required">*</span>
          </label>
          <input
            id="bulk_roll_prefix"
            className={`field-input${errors.roll_prefix ? ' border-danger' : ''}`}
            type="text"
            placeholder="VD: FN-"
            {...register('roll_prefix')}
          />
          {errors.roll_prefix && (
            <span className="field-error">{errors.roll_prefix.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="bulk_start_number">Số bắt đầu</label>
          <input
            id="bulk_start_number"
            className={`field-input${errors.start_number ? ' border-danger' : ''}`}
            type="number"
            min="1"
            step="1"
            {...register('start_number')}
          />
          {errors.start_number && (
            <span className="field-error">{errors.start_number.message}</span>
          )}
        </div>
      </div>
    </fieldset>
  );
}
