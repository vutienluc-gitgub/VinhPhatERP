import { useFormContext, Controller } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import {
  LABEL_ORIGIN,
  ORIGIN_OPTIONS,
  ORIGIN_PLACEHOLDER,
} from '@/shared/constants/origin.constants';
import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';
import { YARN_CATALOG_MESSAGES as MSG } from '@/features/yarn-catalog/yarn-catalog.constants';

type StepGeneralInfoProps = {
  hidden: boolean;
  isEditing: boolean;
};

export function StepGeneralInfo({ hidden, isEditing }: StepGeneralInfoProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<YarnCatalogFormValues>();

  return (
    <div className={hidden ? 'hidden' : 'block'}>
      <div className="form-grid">
        <fieldset className="form-section">
          <legend className="form-section-title">{MSG.SECTION_GENERAL}</legend>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="code">
                {MSG.LBL_CODE} <span className="field-required">*</span>
              </label>
              <input
                id="code"
                className={`field-input${errors.code ? ' border-danger' : ''}`}
                type="text"
                placeholder="VD: YS-001"
                readOnly={!isEditing}
                {...register('code')}
              />
              {errors.code && (
                <span className="field-error">{errors.code.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="name">
                {MSG.LBL_NAME} <span className="field-required">*</span>
              </label>
              <input
                id="name"
                className={`field-input bg-surface/50${errors.name ? ' border-danger' : ''}`}
                type="text"
                placeholder="Tự động tạo từ thông số kỹ thuật"
                readOnly
                {...register('name')}
              />
              {errors.name && (
                <span className="field-error">{errors.name.message}</span>
              )}
            </div>
          </div>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="composition">{MSG.LBL_COMPOSITION}</label>
              <input
                id="composition"
                className="field-input"
                type="text"
                placeholder="VD: 100% Polyester"
                {...register('composition')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="origin">{LABEL_ORIGIN}</label>
              <Controller
                name="origin"
                control={control}
                render={({ field }) => (
                  <Combobox
                    id="origin"
                    options={ORIGIN_OPTIONS}
                    value={field.value ?? undefined}
                    onChange={(val) => field.onChange(val || null)}
                    allowInput
                    placeholder={ORIGIN_PLACEHOLDER}
                  />
                )}
              />
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
