import { useFormContext, useWatch } from 'react-hook-form';

import { ComboboxField } from '@/shared/components/ComboboxField';
import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';
import {
  YARN_CATEGORY_OPTIONS,
  YARN_TYPE_OPTIONS,
  YARN_DENIER_OPTIONS,
  YARN_FILAMENT_OPTIONS,
  YARN_FINISH_OPTIONS,
  YARN_COLOR_STATUS_OPTIONS,
  YARN_NE_COUNT_OPTIONS,
  YARN_SPINNING_METHOD_OPTIONS,
  YARN_TWIST_TYPE_OPTIONS,
  SPUN_YARN_CATEGORIES,
  YARN_INTERMINGLE_OPTIONS,
} from '@/shared/constants/yarn-classification';

type StepTechnicalSpecsProps = {
  hidden: boolean;
  colorComboboxOptions: { value: string; label: string }[];
};

export function StepTechnicalSpecs({
  hidden,
  colorComboboxOptions,
}: StepTechnicalSpecsProps) {
  const { control, register } = useFormContext<YarnCatalogFormValues>();

  const watchedCategory = useWatch({ control, name: 'category' });
  const watchedIsFancy = useWatch({ control, name: 'is_fancy' });
  const isSpunYarn = SPUN_YARN_CATEGORIES.has(watchedCategory ?? '');

  return (
    <div className={hidden ? 'hidden' : 'block'}>
      <div className="form-grid">
        <fieldset className="form-section">
          <legend className="form-section-title">Phân loại kỹ thuật</legend>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
            <ComboboxField
              name="category"
              control={control}
              options={YARN_CATEGORY_OPTIONS}
              label="Chất liệu (Level 1)"
              allowInput
              placeholder="VD: Polyester, Cotton..."
            />
            <ComboboxField
              name="yarn_type"
              control={control}
              options={YARN_TYPE_OPTIONS}
              label="Loại sợi (Level 2)"
              allowInput
              placeholder="VD: DTY, FDY, CM..."
            />
          </div>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
            {isSpunYarn ? (
              <>
                <ComboboxField
                  name="count_ne"
                  control={control}
                  options={YARN_NE_COUNT_OPTIONS}
                  label="Chi số (Ne)"
                  allowInput
                  placeholder="VD: Ne 30"
                />
                <ComboboxField
                  name="spinning_method"
                  control={control}
                  options={YARN_SPINNING_METHOD_OPTIONS}
                  label="Phương pháp kéo sợi"
                  allowInput
                  placeholder="VD: Ring Spun"
                />
              </>
            ) : (
              <>
                <ComboboxField
                  name="denier"
                  control={control}
                  options={YARN_DENIER_OPTIONS}
                  label="Denier"
                  allowInput
                  placeholder="VD: 150D"
                />
                <ComboboxField
                  name="filament_count"
                  control={control}
                  options={YARN_FILAMENT_OPTIONS}
                  label="Filament"
                  allowInput
                  placeholder="VD: 48F"
                />
              </>
            )}
            <div className="form-field">
              <label htmlFor="tensile_strength">Cường lực</label>
              <input
                id="tensile_strength"
                className="field-input"
                type="text"
                placeholder="VD: 18 cN/tex"
                {...register('tensile_strength')}
              />
            </div>
          </div>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
            <ComboboxField
              name="twist_type"
              control={control}
              options={YARN_TWIST_TYPE_OPTIONS}
              label="Hướng xoắn / Kiểu xoắn"
              allowInput
              placeholder="VD: S-Twist"
            />
            <div className="form-field flex items-end gap-2 pb-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="field-checkbox"
                  {...register('is_fancy')}
                />
                <span>Sợi Fancy (Slub, Injection...)</span>
              </label>
            </div>
          </div>

          {watchedIsFancy && (
            <div className="form-field">
              <label htmlFor="fancy_details">Chi tiết Fancy</label>
              <input
                id="fancy_details"
                className="field-input"
                type="text"
                placeholder="VD: Random slub 3-7cm, thick/thin variation"
                {...register('fancy_details')}
              />
            </div>
          )}
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section-title">Hiệu ứng & Màu sắc</legend>

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
            <ComboboxField
              name="finish"
              control={control}
              options={YARN_FINISH_OPTIONS}
              label="Finish (Bề mặt)"
              allowInput
              placeholder="VD: Semi Dull"
            />
            <ComboboxField
              name="color_status"
              control={control}
              options={YARN_COLOR_STATUS_OPTIONS}
              label="Trạng thái màu"
              allowInput
              placeholder="VD: Raw White"
            />
            <ComboboxField
              name="color_name"
              control={control}
              options={colorComboboxOptions}
              label="Màu mặc định"
              placeholder="Chọn hoặc nhập màu..."
            />
            {!isSpunYarn && (
              <div className="form-field">
                <label htmlFor="intermingle">Độ đan gút (Intermingle)</label>
                <ComboboxField
                  name="intermingle"
                  control={control}
                  options={YARN_INTERMINGLE_OPTIONS}
                  placeholder="VD: SIM, NIM..."
                  allowInput
                />
              </div>
            )}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
