import { Controller } from 'react-hook-form';
import type {
  UseFormRegister,
  Control,
  FieldErrors,
  UseFormSetValue,
} from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import type { FinishedFabricFormValues } from '@/schema/finished-fabric.schema';
import { FINISHED_FABRIC_FORM_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';

type FinishedFabricFormStep2SpecsProps = {
  register: UseFormRegister<FinishedFabricFormValues>;
  control: Control<FinishedFabricFormValues>;
  errors: FieldErrors<FinishedFabricFormValues>;
  setValue: UseFormSetValue<FinishedFabricFormValues>;
  colorComboboxOptions: { value: string; label: string; code?: string }[];
};

export function FinishedFabricFormStep2Specs({
  register,
  control,
  errors,
  setValue,
  colorComboboxOptions,
}: FinishedFabricFormStep2SpecsProps) {
  return (
    <div className="form-grid">
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="color_name">{MSG.LBL_COLOR_NAME}</label>
          <Controller
            name="color_name"
            control={control}
            render={({ field }) => (
              <Combobox
                options={colorComboboxOptions}
                value={field.value ?? ''}
                onChange={(val) => {
                  field.onChange(val);
                  const selected = colorComboboxOptions.find(
                    (c) => c.value === val,
                  );
                  if (selected && selected.code) {
                    setValue('color_code', selected.code, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
                placeholder={MSG.PLACEHOLDER_COLOR}
              />
            )}
          />
        </div>

        <div className="form-field">
          <label htmlFor="color_code">{MSG.LBL_COLOR_CODE}</label>
          <input
            id="color_code"
            className="field-input"
            type="text"
            placeholder="VD: TC-01"
            {...register('color_code')}
          />
        </div>
      </div>

      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="width_cm">{MSG.LBL_WIDTH_CM}</label>
          <input
            id="width_cm"
            className={`field-input${errors.width_cm ? ' border-danger' : ''}`}
            type="number"
            step="0.01"
            min="0"
            placeholder="VD: 150"
            {...register('width_cm')}
          />
          {errors.width_cm && (
            <span className="field-error">{errors.width_cm.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="length_m">{MSG.LBL_LENGTH_M}</label>
          <input
            id="length_m"
            className={`field-input${errors.length_m ? ' border-danger' : ''}`}
            type="number"
            step="0.001"
            min="0"
            placeholder="VD: 50"
            {...register('length_m')}
          />
          {errors.length_m && (
            <span className="field-error">{errors.length_m.message}</span>
          )}
        </div>
      </div>

      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="weight_kg">{MSG.LBL_WEIGHT_KG}</label>
          <input
            id="weight_kg"
            className={`field-input${errors.weight_kg ? ' border-danger' : ''}`}
            type="number"
            step="0.001"
            min="0"
            placeholder="VD: 25.5"
            {...register('weight_kg')}
          />
          {errors.weight_kg && (
            <span className="field-error">{errors.weight_kg.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
