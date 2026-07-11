import { useFormContext, Controller } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import type { BomTemplateFormData } from '@/schema/bom.schema';

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
        <div className="form-field">
          <label>Khổ vải (cm)</label>
          <input
            type="number"
            {...register('target_width_cm', {
              setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
            })}
            className="field-input"
          />
        </div>
        <div className="form-field">
          <label>Định lượng (gsm)</label>
          <input
            type="number"
            {...register('target_gsm', {
              setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
            })}
            className="field-input"
          />
        </div>
        <div className="form-field">
          <label>Hao hụt mặc định (%)</label>
          <input
            type="number"
            step="0.01"
            {...register('standard_loss_pct', {
              setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
            })}
            className="field-input"
          />
        </div>
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
