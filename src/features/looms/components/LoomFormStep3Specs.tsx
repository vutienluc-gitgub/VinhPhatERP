import { useFormContext, Controller } from 'react-hook-form';

import { Icon } from '@/shared/components';
import type { LoomFormValues } from '@/schema/loom.schema';
import { NumericInput, WeightInput } from '@/shared/value';

type Props = {
  isTechnicalLocked: boolean;
};

export function LoomFormStep3Specs({ isTechnicalLocked }: Props) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<LoomFormValues>();

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground dark:text-muted mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
        <Icon name="Settings" size={16} className="text-info" />
        Thông số kỹ thuật chi tiết
      </h3>
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        <Controller
          name="feeders"
          control={control}
          render={({ field }) => (
            <NumericInput
              id="loom-feeders"
              className={`field-input${errors.feeders ? ' border-danger' : ''}`}
              step="1"
              min="0"
              placeholder="VD: 96"
              disabled={isTechnicalLocked}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="needles"
          control={control}
          render={({ field }) => (
            <NumericInput
              id="loom-needles"
              className={`field-input${errors.needles ? ' border-danger' : ''}`}
              step="1"
              min="0"
              placeholder="VD: 2816"
              disabled={isTechnicalLocked}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <div className="form-field">
          <label htmlFor="loom-gsm">GSM Range</label>
          <input
            id="loom-gsm"
            className={`field-input${errors.gsm_range ? ' border-danger' : ''}`}
            type="text"
            placeholder="VD: 140-220"
            disabled={isTechnicalLocked}
            {...register('gsm_range')}
          />
          {errors.gsm_range && (
            <span className="field-error">{errors.gsm_range.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="loom-yarn">Yarn Support</label>
          <input
            id="loom-yarn"
            className={`field-input${errors.yarn_support ? ' border-danger' : ''}`}
            type="text"
            placeholder="VD: Cotton/CVC/TC"
            disabled={isTechnicalLocked}
            {...register('yarn_support')}
          />
          {errors.yarn_support && (
            <span className="field-error">{errors.yarn_support.message}</span>
          )}
        </div>

        <Controller
          name="motor_power_kw"
          control={control}
          render={({ field }) => (
            <NumericInput
              id="loom-motor"
              className={`field-input${errors.motor_power_kw ? ' border-danger' : ''}`}
              step="0.1"
              min="0"
              placeholder="VD: 5.5"
              disabled={isTechnicalLocked}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <div className="form-field">
          <label htmlFor="loom-voltage">Điện áp</label>
          <input
            id="loom-voltage"
            className={`field-input${errors.voltage ? ' border-danger' : ''}`}
            type="text"
            placeholder="VD: 380V/3P/50Hz"
            disabled={isTechnicalLocked}
            {...register('voltage')}
          />
          {errors.voltage && (
            <span className="field-error">{errors.voltage.message}</span>
          )}
        </div>

        <Controller
          name="weight_kg"
          control={control}
          render={({ field }) => (
            <WeightInput
              id="loom-weight"
              className={`field-input${errors.weight_kg ? ' border-danger' : ''}`}
              step="1"
              min="0"
              placeholder="VD: 4200"
              disabled={isTechnicalLocked}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>
    </section>
  );
}
