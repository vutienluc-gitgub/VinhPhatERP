import { useFormContext, useWatch } from 'react-hook-form';

import { ComboboxField } from '@/shared/components/ComboboxField';
import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';
import { YARN_CERTIFICATION_OPTIONS } from '@/shared/constants/yarn-classification';
import { YARN_CATALOG_STATUS_LABELS } from '@/schema/yarn-catalog.schema';
import { YARN_CATALOG_MESSAGES as MSG } from '@/features/yarn-catalog/yarn-catalog.constants';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'cuộn', label: 'cuộn' },
  { value: 'tấn', label: 'tấn' },
];

const STATUS_OPTIONS = (['active', 'inactive'] as const).map((s) => ({
  value: s,
  label: YARN_CATALOG_STATUS_LABELS[s],
}));

type StepAdditionalInfoProps = {
  hidden: boolean;
};

export function StepAdditionalInfo({ hidden }: StepAdditionalInfoProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<YarnCatalogFormValues>();

  const currentCerts = useWatch({ control, name: 'certifications' }) ?? [];

  return (
    <div className={hidden ? 'hidden' : 'block'}>
      <div className="form-grid">
        <fieldset className="form-section">
          <legend className="form-section-title">{MSG.SECTION_CERT}</legend>
          <div className="flex flex-wrap gap-3">
            {YARN_CERTIFICATION_OPTIONS.map((cert) => {
              const isChecked = currentCerts.includes(cert.value);
              return (
                <label
                  key={cert.value}
                  className="inline-flex items-center gap-1.5 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    className="field-checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...currentCerts, cert.value]
                        : currentCerts.filter((c: string) => c !== cert.value);
                      setValue('certifications', next, { shouldDirty: true });
                    }}
                  />
                  <span>{cert.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section-title">
            {MSG.SECTION_ADDITIONAL}
          </legend>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
            <div className="form-field">
              <label htmlFor="lot_no">{MSG.LBL_LOT_NO}</label>
              <input
                id="lot_no"
                className="field-input"
                type="text"
                placeholder="VD: PT40092"
                {...register('lot_no')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="grade">{MSG.LBL_GRADE}</label>
              <input
                id="grade"
                className="field-input"
                type="text"
                placeholder="VD: A, B, C..."
                {...register('grade')}
              />
            </div>

            <ComboboxField
              name="unit"
              control={control}
              options={UNIT_OPTIONS}
              label={MSG.LBL_UNIT}
              hasError={!!errors.unit}
              placeholder={MSG.PLACEHOLDER_SELECT}
            />

            <ComboboxField
              name="status"
              control={control}
              options={STATUS_OPTIONS}
              label={MSG.LBL_STATUS}
              hasError={!!errors.status}
            />
          </div>

          {errors.unit && (
            <span className="field-error">{errors.unit.message}</span>
          )}

          <div className="form-field">
            <label htmlFor="notes">{MSG.LBL_NOTES}</label>
            <textarea
              id="notes"
              className="field-textarea"
              rows={2}
              placeholder={MSG.PLACEHOLDER_NOTES}
              {...register('notes')}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}
