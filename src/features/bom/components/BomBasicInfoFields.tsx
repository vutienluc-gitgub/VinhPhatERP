import { useFormContext, Controller } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import type { BomTemplateFormData } from '@/schema/bom.schema';
import { LengthInput, DensityInput, WeightInput } from '@/shared/value';

interface BomBasicInfoFieldsProps {
  fabricOptions: { value: string; label: string; code: string }[];
}

export function BomBasicInfoFields({ fabricOptions }: BomBasicInfoFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BomTemplateFormData>();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="form-field">
          <label>
            Mã BOM <span className="text-xs text-muted">(tự sinh)</span>
          </label>
          <input
            type="text"
            {...register('code')}
            readOnly
            className="field-input bg-surface-raised cursor-default"
            placeholder="Chọn sản phẩm mộc + sợi → tự sinh"
          />
          <span className="field-hint">
            Mã tự động: BOM‑&lt;mã vải mộc&gt;‑&lt;mã sợi&gt;
          </span>
        </div>

        <div className="form-field">
          <label>
            Tên BOM <span className="field-required">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            className={`field-input${errors.name ? ' border-danger' : ''}`}
            placeholder="VD: Định mức Cotton 65/35..."
          />
          {errors.name && (
            <span className="field-error">{errors.name.message}</span>
          )}
        </div>

        <div className="form-field">
          <label>
            Sản phẩm mộc <span className="field-required">*</span>
          </label>
          <Controller
            name="target_fabric_id"
            control={control}
            render={({ field }) => (
              <Combobox
                options={fabricOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="-- Chọn sản phẩm mộc --"
                hasError={!!errors.target_fabric_id}
              />
            )}
          />
          {errors.target_fabric_id && (
            <span className="field-error">
              {errors.target_fabric_id.message}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <Controller
          name="target_width_cm"
          control={control}
          render={({ field }) => (
            <LengthInput
              className="field-input"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <Controller
          name="target_gsm"
          control={control}
          render={({ field }) => (
            <DensityInput
              className="field-input"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <Controller
          name="standard_loss_pct"
          control={control}
          render={({ field }) => (
            <WeightInput
              step="0.01"
              className="field-input"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <div className="form-field">
          <label>Ghi chú</label>
          <input
            type="text"
            {...register('notes')}
            className="field-input"
            placeholder="Thông tin bổ sung..."
          />
        </div>
      </div>
    </>
  );
}
