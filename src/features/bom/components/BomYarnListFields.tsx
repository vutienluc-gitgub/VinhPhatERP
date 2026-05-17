import {
  useFormContext,
  useFieldArray,
  Controller,
  useWatch,
} from 'react-hook-form';

import { Icon } from '@/shared/components/Icon';
import { Combobox } from '@/shared/components/Combobox';
import { BasicNumberInput } from '@/shared/components/BasicNumberInput';
import { sumBy } from '@/shared/utils/array.util';
import type { BomTemplateFormData } from '@/schema/bom.schema';

interface BomYarnListFieldsProps {
  yarnOptions: { value: string; label: string; code: string }[];
}

export function BomYarnListFields({ yarnOptions }: BomYarnListFieldsProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<BomTemplateFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'bom_yarn_items',
  });

  const watchItems = useWatch({ control, name: 'bom_yarn_items' }) || [];
  const totalRatio = sumBy(watchItems, (curr) => Number(curr.ratio_pct) || 0);

  const watchWidthCm = useWatch({ control, name: 'target_width_cm' });
  const watchGsm = useWatch({ control, name: 'target_gsm' });
  const watchLoss = useWatch({ control, name: 'standard_loss_pct' }) || 0;

  return (
    <div className="border-t border-border mt-6 pt-5">
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="font-bold text-lg block mb-0.5">
            Thành phần nguyên liệu
          </span>
          <p className="text-xs text-muted">
            Tổng tỉ lệ:{' '}
            <strong
              className={
                Math.abs(totalRatio - 100) > 0.01
                  ? 'text-danger'
                  : 'text-success'
              }
            >
              {totalRatio.toFixed(2)}%
            </strong>
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary flex items-center gap-1.5"
          onClick={() =>
            append({
              yarn_catalog_id: '',
              ratio_pct: 0,
              consumption_kg_per_m: 0.5,
              sort_order: fields.length,
            })
          }
        >
          <Icon name="Plus" size={16} />
          Thêm sợi
        </button>
      </div>

      {errors.bom_yarn_items?.root && (
        <p className="field-error mb-3">{errors.bom_yarn_items.root.message}</p>
      )}

      <div className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex gap-2 items-start p-3 border border-border rounded-lg"
          >
            <div className="form-grid flex-1 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
              <div className="form-field">
                <label>Loại sợi</label>
                <Controller
                  name={`bom_yarn_items.${index}.yarn_catalog_id` as const}
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={yarnOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="— Chọn sợi —"
                      hasError={
                        !!errors.bom_yarn_items?.[index]?.yarn_catalog_id
                      }
                    />
                  )}
                />
                {errors.bom_yarn_items?.[index]?.yarn_catalog_id && (
                  <span className="field-error">
                    {errors.bom_yarn_items[index]?.yarn_catalog_id?.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label>Tỉ lệ (%)</label>
                <Controller
                  name={`bom_yarn_items.${index}.ratio_pct` as const}
                  control={control}
                  render={({ field }) => (
                    <BasicNumberInput
                      className={`field-input${errors.bom_yarn_items?.[index]?.ratio_pct ? ' is-error' : ''}`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      step="0.01"
                    />
                  )}
                />
                {errors.bom_yarn_items?.[index]?.ratio_pct && (
                  <span className="field-error">
                    {errors.bom_yarn_items[index]?.ratio_pct?.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label>
                  Tiêu hao (kg/m)
                  {watchWidthCm && watchGsm && (
                    <span className="text-[10px] text-muted ml-1 font-normal">
                      (Tự động)
                    </span>
                  )}
                </label>
                <Controller
                  name={`bom_yarn_items.${index}.consumption_kg_per_m` as const}
                  control={control}
                  render={({ field }) => (
                    <BasicNumberInput
                      className={`field-input${watchWidthCm && watchGsm ? ' bg-surface-raised cursor-default' : ''}${errors.bom_yarn_items?.[index]?.consumption_kg_per_m ? ' is-error' : ''}`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      step="0.0001"
                      readOnly={!!(watchWidthCm && watchGsm)}
                    />
                  )}
                />
                {watchWidthCm && watchGsm && (
                  <span className="field-hint text-[11px] mt-1 block h-[18px]">
                    Thực cấp mộc (gồm {watchLoss}% hao hụt):{' '}
                    <strong className="text-secondary">
                      {watchLoss < 100
                        ? (
                            Number(
                              watchItems[index]?.consumption_kg_per_m || 0,
                            ) /
                            (1 - watchLoss / 100)
                          ).toFixed(4)
                        : 0}{' '}
                      kg
                    </strong>
                  </span>
                )}
                {errors.bom_yarn_items?.[index]?.consumption_kg_per_m && (
                  <span className="field-error">
                    {
                      errors.bom_yarn_items[index]?.consumption_kg_per_m
                        ?.message
                    }
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn-icon text-danger mt-6 flex-shrink-0"
              onClick={() => remove(index)}
              title="Xóa dòng"
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-sm text-muted">
            Chưa có loại sợi nào. Nhấn "Thêm sợi" để bắt đầu.
          </div>
        )}
      </div>
    </div>
  );
}
