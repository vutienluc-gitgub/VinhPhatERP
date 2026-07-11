import { Controller, useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import type { LoomFormValues } from '@/schema/loom.schema';
import { LOOM_STATUS_LABELS, LOOM_STATUSES } from '@/schema/loom.schema';

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
    register,
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
          <div className="form-field">
            <label htmlFor="loom-width">Khổ dệt tối đa (cm)</label>
            <input
              id="loom-width"
              className={`field-input${errors.max_width_cm ? ' border-danger' : ''}`}
              type="number"
              step="0.1"
              min="0"
              placeholder="VD: 360"
              disabled={isTechnicalLocked}
              {...register('max_width_cm', {
                setValueAs: (v) =>
                  v === '' || Number.isNaN(Number(v)) ? null : Number(v),
              })}
            />
            {errors.max_width_cm && (
              <span className="field-error">{errors.max_width_cm.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="loom-speed">Tốc độ (vòng/phút)</label>
            <input
              id="loom-speed"
              className={`field-input${errors.max_speed_rpm ? ' border-danger' : ''}`}
              type="number"
              step="1"
              min="0"
              placeholder="VD: 600"
              disabled={isTechnicalLocked}
              {...register('max_speed_rpm', {
                setValueAs: (v) =>
                  v === '' || Number.isNaN(Number(v)) ? null : Number(v),
              })}
            />
            {errors.max_speed_rpm && (
              <span className="field-error">
                {errors.max_speed_rpm.message}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="loom-capacity">Công suất (m/ngày)</label>
            <input
              id="loom-capacity"
              className={`field-input${errors.daily_capacity_m ? ' border-danger' : ''}`}
              type="number"
              step="0.1"
              min="0"
              placeholder="VD: 200"
              disabled={isTechnicalLocked}
              {...register('daily_capacity_m', {
                setValueAs: (v) =>
                  v === '' || Number.isNaN(Number(v)) ? null : Number(v),
              })}
            />
            {errors.daily_capacity_m && (
              <span className="field-error">
                {errors.daily_capacity_m.message}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="loom-capacity-kg">Công suất (kg/ngày)</label>
            <input
              id="loom-capacity-kg"
              className={`field-input${errors.daily_capacity_kg ? ' border-danger' : ''}`}
              type="number"
              step="0.1"
              min="0"
              placeholder="VD: 180"
              disabled={isTechnicalLocked}
              {...register('daily_capacity_kg', {
                setValueAs: (v) =>
                  v === '' || Number.isNaN(Number(v)) ? null : Number(v),
              })}
            />
            {errors.daily_capacity_kg && (
              <span className="field-error">
                {errors.daily_capacity_kg.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
