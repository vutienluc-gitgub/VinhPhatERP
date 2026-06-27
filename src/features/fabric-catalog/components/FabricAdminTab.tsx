import { useFormContext, Controller } from 'react-hook-form';

import { Combobox } from '@/shared/components';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { LABELS, STATUS_OPTIONS } from '@/features/fabric-catalog/fabric-catalog.constants';

export function FabricAdminTab() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

  return (
    <div className="space-y-4">
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label>{LABELS.STATUS}</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Combobox
                options={STATUS_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                hasError={!!errors.status}
              />
            )}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="fc-notes">{LABELS.NOTES_LABEL}</label>
        <textarea
          id="fc-notes"
          className="field-textarea"
          rows={4}
          placeholder={LABELS.NOTES_PLACEHOLDER}
          {...register('notes')}
        />
      </div>
    </div>
  );
}
