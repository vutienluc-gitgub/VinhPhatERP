import {
  Control,
  useFieldArray,
  UseFormRegister,
  UseFormWatch,
  Controller,
} from 'react-hook-form';

import { Icon } from '@/shared/components/Icon';
import { Combobox } from '@/shared/components/Combobox';
import { useYarnCatalogOptions } from '@/shared/hooks/useYarnCatalogOptions';
import {
  calcTotalBomRatio,
  calcTotalRequiredKg,
} from '@/shared/utils/yarn-requirement.util';
import type { CreateWorkOrderInput } from '@/schema/work-order.schema';

interface WorkOrderYarnTableProps {
  control: Control<CreateWorkOrderInput>;
  register: UseFormRegister<CreateWorkOrderInput>;
  watch: UseFormWatch<CreateWorkOrderInput>;
}

export function WorkOrderYarnTable({
  control,
  register,
  watch,
}: WorkOrderYarnTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'yarn_requirements',
  });

  const { data: yarnOptions = [] } = useYarnCatalogOptions();

  return (
    <div className="panel-card card-flush mt-4">
      <div className="card-header-area">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold">Phân bổ sợi</h4>
          <button
            type="button"
            className="btn-secondary flex items-center gap-1.5"
            onClick={() =>
              append({
                yarn_catalog_id: '',
                bom_ratio_pct: 0,
                required_kg: 0,
              })
            }
          >
            <Icon name="Plus" size={16} />
            Thêm sợi
          </button>
        </div>
      </div>

      <div className="card-table-section max-h-[300px] overflow-y-auto overflow-x-auto hide-scrollbar">
        <table className="data-table table-sm">
          <thead>
            <tr>
              <th className="w-[45%]">Loại sợi</th>
              <th className="text-right w-[20%]">% BOM</th>
              <th className="text-right w-[25%]">Cần (kg)</th>
              <th className="w-[10%]" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const yarns = watch('yarn_requirements') || [];
              const allocatedKg = yarns[index]?.allocated_kg || 0;
              const isLocked = allocatedKg > 0;

              return (
                <tr key={field.id}>
                  <td>
                    <Controller
                      name={`yarn_requirements.${index}.yarn_catalog_id`}
                      control={control}
                      render={({ field: comboField }) => (
                        <Combobox
                          options={yarnOptions.map((y) => ({
                            value: y.id,
                            label: `${y.name} ${y.color_name ? `(${y.color_name})` : ''}`,
                            code: y.code,
                          }))}
                          value={comboField.value}
                          onChange={comboField.onChange}
                          placeholder="Chọn sợi..."
                          disabled={isLocked}
                        />
                      )}
                    />
                    {isLocked && (
                      <div className="text-xs text-success mt-1 flex items-center gap-1 font-medium">
                        <Icon name="CheckCircle2" size={12} />
                        Đã xuất:{' '}
                        {allocatedKg.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{' '}
                        kg
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      {...register(`yarn_requirements.${index}.bom_ratio_pct`, {
                        valueAsNumber: true,
                      })}
                      className="field-input text-right"
                      placeholder="%"
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const next = document.getElementsByName(
                            `yarn_requirements.${index + 1}.bom_ratio_pct`,
                          )[0];
                          if (next) (next as HTMLInputElement).focus();
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const prev = document.getElementsByName(
                            `yarn_requirements.${index - 1}.bom_ratio_pct`,
                          )[0];
                          if (prev) (prev as HTMLInputElement).focus();
                        }
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`yarn_requirements.${index}.required_kg`, {
                        valueAsNumber: true,
                      })}
                      className="field-input text-right font-bold text-primary"
                      placeholder="kg"
                      min={allocatedKg > 0 ? allocatedKg : 0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (index === fields.length - 1) {
                            append({
                              yarn_catalog_id: '',
                              bom_ratio_pct: 0,
                              required_kg: 0,
                            });
                            setTimeout(() => {
                              const next = document.getElementsByName(
                                `yarn_requirements.${index + 1}.bom_ratio_pct`,
                              )[0];
                              if (next) (next as HTMLInputElement).focus();
                            }, 10);
                          }
                        }
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const next = document.getElementsByName(
                            `yarn_requirements.${index + 1}.required_kg`,
                          )[0];
                          if (next) (next as HTMLInputElement).focus();
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const prev = document.getElementsByName(
                            `yarn_requirements.${index - 1}.required_kg`,
                          )[0];
                          if (prev) (prev as HTMLInputElement).focus();
                        }
                      }}
                    />
                  </td>
                  <td className="text-center">
                    {isLocked ? (
                      <button
                        type="button"
                        className="btn-icon text-muted cursor-not-allowed opacity-50 block mx-auto"
                        title="Đã xuất kho, không thể xoá"
                        disabled
                      >
                        <Icon name="Lock" size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-icon text-danger block mx-auto"
                        onClick={() => remove(index)}
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="text-right">TỔNG:</td>
              <td className="text-right">
                {calcTotalBomRatio(watch('yarn_requirements') || []).toFixed(1)}
                %
              </td>
              <td className="text-right text-primary">
                {calcTotalRequiredKg(watch('yarn_requirements') || []).toFixed(
                  2,
                )}{' '}
                kg
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-4 py-2 text-xs text-muted border-t border-border">
        * Enter ở cột KG dòng cuối để thêm dòng mới. Mũi tên Lên/Xuống để di
        chuyển nhanh.
      </div>
    </div>
  );
}
