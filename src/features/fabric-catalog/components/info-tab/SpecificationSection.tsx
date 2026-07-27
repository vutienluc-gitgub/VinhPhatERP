import { useFormContext, Controller } from 'react-hook-form';

import { Combobox } from '@/shared/components';
import { LengthField, DensityField } from '@/shared/value';
import { NumericField } from '@/shared/value/core/NumericField';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import {
  LABELS,
  PUBLIC_PAGE_LABELS,
  STRETCH_TYPE_MAP,
  THICKNESS_MAP,
} from '@/features/fabric-catalog/fabric-catalog.constants';

const STRETCH_OPTIONS = Object.entries(STRETCH_TYPE_MAP).map(
  ([value, label]) => ({ value, label }),
);
const THICKNESS_OPTIONS = Object.entries(THICKNESS_MAP).map(
  ([value, label]) => ({ value, label }),
);

export function SpecificationSection() {
  const {
    control,
    watch,
    register,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();
  const errs = errors as Record<string, { message?: string }>;
  const fabricType = watch('fabric_type');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Thông số kỹ thuật
        </h3>
      </div>
      <div className="form-grid sm:grid-cols-2">
        <LengthField
          control={control}
          name="target_width_cm"
          label={LABELS.WIDTH}
          suffix="cm"
          placeholder={LABELS.WIDTH_PLACEHOLDER}
          allowNegative={false}
        />

        <DensityField
          control={control}
          name="target_gsm"
          label={LABELS.GSM}
          placeholder={LABELS.GSM_PLACEHOLDER}
          allowNegative={false}
        />

        <div className="form-field">
          <label>{PUBLIC_PAGE_LABELS.stretch}</label>
          <Controller
            name="stretch_type"
            control={control}
            render={({ field }) => (
              <Combobox
                options={STRETCH_OPTIONS}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                placeholder={LABELS.STRETCH_PLACEHOLDER}
              />
            )}
          />
        </div>

        <div className="form-field">
          <label>{PUBLIC_PAGE_LABELS.thickness}</label>
          <Controller
            name="thickness"
            control={control}
            render={({ field }) => (
              <Combobox
                options={THICKNESS_OPTIONS}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                placeholder={LABELS.THICKNESS_PLACEHOLDER}
              />
            )}
          />
        </div>

        {fabricType === 'knitted' && (
          <>
            <NumericField
              control={control}
              name="gauge"
              label={LABELS.GAUGE}
              placeholder="VD: 24"
              allowNegative={false}
            />
            <NumericField
              control={control}
              name="diameter"
              label={LABELS.DIAMETER}
              placeholder="VD: 34"
              allowNegative={false}
            />
            <div className="form-field sm:col-span-2">
              <label htmlFor="fc-machine-type">{LABELS.MACHINE_TYPE}</label>
              <input
                id="fc-machine-type"
                className={`field-input${errs.machine_type ? ' border-danger' : ''}`}
                type="text"
                placeholder="VD: Single Jersey"
                {...register('machine_type')}
              />
              {errs.machine_type && (
                <span className="field-error">{errs.machine_type.message}</span>
              )}
            </div>
            <div className="sm:col-span-2">
              <NumericField
                control={control}
                name="needle_count"
                label={LABELS.NEEDLE_COUNT}
                placeholder="VD: 2880"
                allowNegative={false}
              />
            </div>
          </>
        )}

        {fabricType === 'woven' && (
          <>
            <div className="form-field">
              <label htmlFor="fc-warp-count">{LABELS.WARP_COUNT}</label>
              <input
                id="fc-warp-count"
                className={`field-input${errs.warp_count ? ' border-danger' : ''}`}
                type="text"
                placeholder="VD: 40S"
                {...register('warp_count')}
              />
              {errs.warp_count && (
                <span className="field-error">{errs.warp_count.message}</span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="fc-weft-count">{LABELS.WEFT_COUNT}</label>
              <input
                id="fc-weft-count"
                className={`field-input${errs.weft_count ? ' border-danger' : ''}`}
                type="text"
                placeholder="VD: 40S"
                {...register('weft_count')}
              />
              {errs.weft_count && (
                <span className="field-error">{errs.weft_count.message}</span>
              )}
            </div>
            <NumericField
              control={control}
              name="epi"
              label={LABELS.EPI}
              placeholder="VD: 120"
              allowNegative={false}
            />
            <NumericField
              control={control}
              name="ppi"
              label={LABELS.PPI}
              placeholder="VD: 80"
              allowNegative={false}
            />
            <div className="form-field sm:col-span-2">
              <label htmlFor="fc-weave-pattern">{LABELS.WEAVE_PATTERN}</label>
              <input
                id="fc-weave-pattern"
                className={`field-input${errs.weave_pattern ? ' border-danger' : ''}`}
                type="text"
                placeholder="VD: Plain, Twill, Satin..."
                {...register('weave_pattern')}
              />
              {errs.weave_pattern && (
                <span className="field-error">
                  {errs.weave_pattern.message}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
