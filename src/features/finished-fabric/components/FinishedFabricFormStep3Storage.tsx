import { Controller } from 'react-hook-form';
import type { UseFormRegister, Control } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import type { FinishedFabricFormValues } from '@/schema/finished-fabric.schema';
import { FINISHED_FABRIC_FORM_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';

type FinishedFabricFormStep3StorageProps = {
  register: UseFormRegister<FinishedFabricFormValues>;
  control: Control<FinishedFabricFormValues>;
  qualityOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
};

export function FinishedFabricFormStep3Storage({
  register,
  control,
  qualityOptions,
  statusOptions,
}: FinishedFabricFormStep3StorageProps) {
  return (
    <div className="form-grid">
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="quality_grade">{MSG.LBL_QUALITY_GRADE}</label>
          <Controller
            name="quality_grade"
            control={control}
            render={({ field }) => (
              <Combobox
                options={qualityOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="status">{MSG.LBL_STATUS}</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Combobox
                options={statusOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="form-field">
          <label htmlFor="production_date">{MSG.LBL_PRODUCTION_DATE}</label>
          <input
            id="production_date"
            className="field-input"
            type="date"
            {...register('production_date')}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="warehouse_location">{MSG.LBL_WAREHOUSE_LOCATION}</label>
        <input
          id="warehouse_location"
          className="field-input"
          type="text"
          placeholder="VD: B2-R1-S4"
          {...register('warehouse_location')}
        />
      </div>

      <div className="form-field">
        <label htmlFor="notes">{MSG.LBL_NOTES}</label>
        <textarea
          id="notes"
          className="field-textarea"
          placeholder="Ghi chú thêm về cuộn thành phẩm..."
          {...register('notes')}
        />
      </div>
    </div>
  );
}
