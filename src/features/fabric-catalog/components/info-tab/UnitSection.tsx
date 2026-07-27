import { useFormContext, Controller } from 'react-hook-form';

import { Combobox } from '@/shared/components';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import {
  LABELS,
  UNIT_OPTIONS,
} from '@/features/fabric-catalog/fabric-catalog.constants';

export function UnitSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Quy đổi
        </h3>
      </div>
      <div className="form-grid sm:grid-cols-2">
        <div className="form-field">
          <label htmlFor="fc-unit">
            {LABELS.UNIT} <span className="field-required">*</span>
          </label>
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <Combobox
                options={UNIT_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                hasError={!!errors.unit}
                placeholder={LABELS.COMBOBOX_DEFAULT_PLACEHOLDER}
              />
            )}
          />
          {errors.unit && (
            <span className="field-error">{errors.unit.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
