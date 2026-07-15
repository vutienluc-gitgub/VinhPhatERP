import { Controller } from 'react-hook-form';
import type { UseFormRegister, Control } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import type { RawFabricFormValues } from '@/schema/raw-fabric.schema';
import { RAW_FABRIC_MESSAGES as MSG } from '@/features/raw-fabric/raw-fabric.constants';

type RawFabricFormStep2StorageProps = {
  register: UseFormRegister<RawFabricFormValues>;
  control: Control<RawFabricFormValues>;
  qualityOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
};

export function RawFabricFormStep2Storage({
  register,
  control,
  qualityOptions,
  statusOptions,
}: RawFabricFormStep2StorageProps) {
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
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </div>

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
      </div>

      <div className="form-field">
        <label htmlFor="warehouse_location">{MSG.LBL_WAREHOUSE_LOCATION}</label>
        <input
          id="warehouse_location"
          className="field-input"
          type="text"
          placeholder="VD: A1-R3-S2"
          {...register('warehouse_location')}
        />
      </div>

      <div className="form-field">
        <label htmlFor="notes">{MSG.LBL_NOTES}</label>
        <textarea
          id="notes"
          className="field-textarea"
          placeholder="Ghi chú thêm về cuộn vải, lỗi dệt nếu có..."
          rows={3}
          {...register('notes')}
        />
      </div>
    </div>
  );
}
