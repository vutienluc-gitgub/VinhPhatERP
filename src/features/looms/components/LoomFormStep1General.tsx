import { Controller, useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import type { LoomFormValues } from '@/schema/loom.schema';
import { LOOM_TYPE_LABELS, LOOM_TYPES } from '@/schema/loom.schema';
import { LengthInput, NumericInput } from '@/shared/value';

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
      <h3 className="text-sm font-semibold text-foreground dark:text-muted mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
        <Icon name="Info" size={16} className="text-info" />
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
          <Controller
            name="diameter_inch"
            control={control}
            render={({ field }) => (
              <LengthInput
                id="loom-diameter"
                className={`field-input${errors.diameter_inch ? ' border-danger' : ''}`}
                step="0.1"
                min="0"
                placeholder="VD: 32"
                disabled={isTechnicalLocked}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            name="gauge"
            control={control}
            render={({ field }) => (
              <NumericInput
                id="loom-gauge"
                className={`field-input${errors.gauge ? ' border-danger' : ''}`}
                step="1"
                min="0"
                placeholder="VD: 28"
                disabled={isTechnicalLocked}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
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
            <span className="text-xs text-muted dark:text-muted-foreground mt-1">
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
