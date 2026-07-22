import { Controller, useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import type { LoomFormValues } from '@/schema/loom.schema';
import { LOOM_STATUS_LABELS, LOOM_STATUSES } from '@/schema/loom.schema';
import { LengthInput, NumericInput, WeightInput } from '@/shared/value';

const STATUS_OPTIONS = LOOM_STATUSES.map((s) => ({
  value: s,
  label: LOOM_STATUS_LABELS[s],
}));

type Props = {
  isTechnicalLocked: boolean;
  supplierOptions: { value: string; label: string }[];
  loadingSuppliers: boolean;
};

export function LoomFormStep2Capacity({
  isTechnicalLocked,
  supplierOptions,
  loadingSuppliers,
}: Props) {
  const {
    control,
    formState: { errors },
  } = useFormContext<LoomFormValues>();

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
        <Icon name="Activity" size={16} className="text-emerald-500" />
        Nhà dệt & Năng lực sản xuất
      </h3>
      <div className="form-grid">
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <div className="form-field">
            <label>
              Nhà dệt <span className="field-required">*</span>
            </label>
            <Controller
              name="supplier_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={supplierOptions}
                  value={field.value}
                  onChange={field.onChange}
                  hasError={!!errors.supplier_id}
                  disabled={isTechnicalLocked}
                  placeholder={
                    loadingSuppliers ? 'Đang tải...' : 'Chọn nhà dệt...'
                  }
                />
              )}
            />
            {errors.supplier_id && (
              <span className="field-error">{errors.supplier_id.message}</span>
            )}
          </div>

          <div className="form-field">
            <label>Trạng thái</label>
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

        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] mt-4">
          <Controller
            name="max_width_cm"
            control={control}
            render={({ field }) => (
              <LengthInput
                id="loom-width"
                className={`field-input${errors.max_width_cm ? ' border-danger' : ''}`}
                step="0.1"
                min="0"
                placeholder="VD: 360"
                disabled={isTechnicalLocked}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            name="max_speed_rpm"
            control={control}
            render={({ field }) => (
              <NumericInput
                id="loom-speed"
                className={`field-input${errors.max_speed_rpm ? ' border-danger' : ''}`}
                step="1"
                min="0"
                placeholder="VD: 600"
                disabled={isTechnicalLocked}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            name="daily_capacity_m"
            control={control}
            render={({ field }) => (
              <NumericInput
                id="loom-capacity"
                className={`field-input${errors.daily_capacity_m ? ' border-danger' : ''}`}
                step="0.1"
                min="0"
                placeholder="VD: 200"
                disabled={isTechnicalLocked}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            name="daily_capacity_kg"
            control={control}
            render={({ field }) => (
              <WeightInput
                id="loom-capacity-kg"
                className={`field-input${errors.daily_capacity_kg ? ' border-danger' : ''}`}
                step="0.1"
                min="0"
                placeholder="VD: 180"
                disabled={isTechnicalLocked}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>
      </div>
    </section>
  );
}
