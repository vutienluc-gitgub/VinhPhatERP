import {
  useFormContext,
  type UseFormRegister,
  type FieldErrors,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { BulkFinishedInputFormValues } from '@/schema/finished-fabric.schema';
import { FINISHED_FABRIC_BULK_CONFIG_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';
import { NumericInput } from '@/shared/value';

type FinishedFabricBulkFormStep1ConfigProps = {
  register: UseFormRegister<BulkFinishedInputFormValues>;
  errors: FieldErrors<BulkFinishedInputFormValues>;
};

export function FinishedFabricBulkFormStep1Config({
  register,
  errors,
}: FinishedFabricBulkFormStep1ConfigProps) {
  const { control } = useFormContext();

  return (
    <fieldset className="bulk-section">
      <legend>{MSG.TITLE_2}</legend>
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="bulk_roll_prefix">
            {MSG.LBL_PREFIX} <span className="field-required">*</span>
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

        <Controller
          name="start_number"
          control={control}
          render={({ field }) => (
            <NumericInput
              id="bulk_start_number"
              className={`field-input${errors.start_number ? ' border-danger' : ''}`}
              min="1"
              step="1"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>
    </fieldset>
  );
}
