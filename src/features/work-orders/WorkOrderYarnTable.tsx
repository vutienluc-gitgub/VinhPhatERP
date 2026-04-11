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

import type { CreateWorkOrderInput } from './work-orders.module';

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
          <h4 className="text-sm font-bold">Phan bo soi (Editable Table)</h4>
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
            Them soi
          </button>
        </div>
      </div>

      <div
        className="card-table-section"
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        <table className="data-table table-sm">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Loai soi</th>
              <th className="text-right" style={{ width: '20%' }}>
                % BOM
              </th>
              <th className="text-right" style={{ width: '25%' }}>
                Can (kg)
              </th>
              <th style={{ width: '10%' }} />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
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
                      />
                    )}
                  />
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
                  <button
                    type="button"
                    className="btn-icon text-danger"
                    onClick={() => remove(index)}
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="text-right">TONG:</td>
              <td className="text-right">
                {watch('yarn_requirements')
                  ?.reduce(
                    (sum, item) => sum + (Number(item.bom_ratio_pct) || 0),
                    0,
                  )
                  .toFixed(1)}
                %
              </td>
              <td className="text-right text-primary">
                {watch('yarn_requirements')
                  ?.reduce(
                    (sum, item) => sum + (Number(item.required_kg) || 0),
                    0,
                  )
                  .toFixed(2)}{' '}
                kg
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-4 py-2 text-xs text-muted border-t border-border">
        * Enter o cot KG dong cuoi de them dong moi. Mui ten Len/Xuong de di
        chuyen nhanh.
      </div>
    </div>
  );
}
