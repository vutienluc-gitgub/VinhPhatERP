import { Controller, useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import type { LoomFormValues } from '@/schema/loom.schema';
import { LOOM_TYPE_LABELS, LOOM_TYPES } from '@/schema/loom.schema';

const TYPE_OPTIONS = LOOM_TYPES.map((t) => ({
  value: t,
  label: LOOM_TYPE_LABELS[t],
}));

type Props = {
  isTechnicalLocked: boolean;
  smartPrefix: string;
};

export function LoomFormStep1General({
  isTechnicalLocked,
  smartPrefix,
}: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<LoomFormValues>();

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
        <Icon name="Info" size={16} className="text-indigo-500" />
        Loại máy & Mã máy
      </h3>
      <div className="form-grid">
        {/* Loại máy — chọn trước để sinh mã */}
        <div className="form-field">
          <label>
            Loại máy <span className="field-required">*</span>
          </label>
          <Controller
            name="loom_type"
            control={control}
            render={({ field }) => (
              <Combobox
                options={TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                hasError={!!errors.loom_type}
                placeholder="Chọn loại máy..."
                disabled={isTechnicalLocked}
              />
            )}
          />
          {errors.loom_type && (
            <span className="field-error">{errors.loom_type.message}</span>
          )}
        </div>

        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] mt-4">
          <div className="form-field">
            <label htmlFor="loom-diameter">Đường kính (inch)</label>
            <input
              id="loom-diameter"
              className={`field-input${errors.diameter_inch ? ' border-danger' : ''}`}
              type="number"
              step="0.1"
              min="0"
              placeholder="VD: 32"
              disabled={isTechnicalLocked}
              {...register('diameter_inch', {
                setValueAs: (v) =>
                  v === '' || Number.isNaN(Number(v)) ? null : Number(v),
              })}
            />
            {errors.diameter_inch && (
              <span className="field-error">
                {errors.diameter_inch.message}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="loom-gauge">Gauge (mật độ kim)</label>
            <input
              id="loom-gauge"
              className={`field-input${errors.gauge ? ' border-danger' : ''}`}
              type="number"
              step="1"
              min="0"
              placeholder="VD: 28"
              disabled={isTechnicalLocked}
              {...register('gauge', {
                setValueAs: (v) =>
                  v === '' || Number.isNaN(Number(v)) ? null : Number(v),
              })}
            />
            {errors.gauge && (
              <span className="field-error">{errors.gauge.message}</span>
            )}
          </div>
        </div>

        {/* Mã máy auto-generated */}
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] mt-4">
          <div className="form-field">
            <label htmlFor="loom-code">
              Mã máy <span className="field-required">*</span>
            </label>
            <input
              id="loom-code"
              className={`field-input${errors.code ? ' border-danger' : ''}`}
              type="text"
              readOnly
              {...register('code')}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tự động: {smartPrefix}-###
            </span>
            {errors.code && (
              <span className="field-error">{errors.code.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="loom-name">
              Tên máy dệt <span className="field-required">*</span>
            </label>
            <input
              id="loom-name"
              className={`field-input${errors.name ? ' border-danger' : ''}`}
              type="text"
              placeholder="VD: Toyota JAT 810"
              {...register('name')}
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
