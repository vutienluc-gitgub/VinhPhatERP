import { useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components';
import type { LoomFormValues } from '@/schema/loom.schema';

type Props = {
  isTechnicalLocked: boolean;
};

export function LoomFormStep3Specs({ isTechnicalLocked }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<LoomFormValues>();

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
        <Icon name="Settings" size={16} className="text-blue-500" />
        Thông số kỹ thuật chi tiết
      </h3>
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        <div className="form-field">
          <label htmlFor="loom-feeders">Feeders (đầu sợi)</label>
          <input
            id="loom-feeders"
            className={`field-input${errors.feeders ? ' is-error' : ''}`}
            type="number"
            step="1"
            min="0"
            placeholder="VD: 96"
            disabled={isTechnicalLocked}
            {...register('feeders', {
              setValueAs: (v) =>
                v === '' || Number.isNaN(Number(v)) ? null : Number(v),
            })}
          />
          {errors.feeders && (
            <span className="field-error">{errors.feeders.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="loom-needles">Kim (Needles)</label>
          <input
            id="loom-needles"
            className={`field-input${errors.needles ? ' is-error' : ''}`}
            type="number"
            step="1"
            min="0"
            placeholder="VD: 2816"
            disabled={isTechnicalLocked}
            {...register('needles', {
              setValueAs: (v) =>
                v === '' || Number.isNaN(Number(v)) ? null : Number(v),
            })}
          />
          {errors.needles && (
            <span className="field-error">{errors.needles.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="loom-gsm">GSM Range</label>
          <input
            id="loom-gsm"
            className={`field-input${errors.gsm_range ? ' is-error' : ''}`}
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
            className={`field-input${errors.yarn_support ? ' is-error' : ''}`}
            type="text"
            placeholder="VD: Cotton/CVC/TC"
            disabled={isTechnicalLocked}
            {...register('yarn_support')}
          />
          {errors.yarn_support && (
            <span className="field-error">{errors.yarn_support.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="loom-motor">Công suất motor (kW)</label>
          <input
            id="loom-motor"
            className={`field-input${errors.motor_power_kw ? ' is-error' : ''}`}
            type="number"
            step="0.1"
            min="0"
            placeholder="VD: 5.5"
            disabled={isTechnicalLocked}
            {...register('motor_power_kw', {
              setValueAs: (v) =>
                v === '' || Number.isNaN(Number(v)) ? null : Number(v),
            })}
          />
          {errors.motor_power_kw && (
            <span className="field-error">{errors.motor_power_kw.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="loom-voltage">Điện áp</label>
          <input
            id="loom-voltage"
            className={`field-input${errors.voltage ? ' is-error' : ''}`}
            type="text"
            placeholder="VD: 380V/3P/50Hz"
            disabled={isTechnicalLocked}
            {...register('voltage')}
          />
          {errors.voltage && (
            <span className="field-error">{errors.voltage.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="loom-weight">Trọng lượng (kg)</label>
          <input
            id="loom-weight"
            className={`field-input${errors.weight_kg ? ' is-error' : ''}`}
            type="number"
            step="1"
            min="0"
            placeholder="VD: 4200"
            disabled={isTechnicalLocked}
            {...register('weight_kg', {
              setValueAs: (v) =>
                v === '' || Number.isNaN(Number(v)) ? null : Number(v),
            })}
          />
          {errors.weight_kg && (
            <span className="field-error">{errors.weight_kg.message}</span>
          )}
        </div>
      </div>
    </section>
  );
}
