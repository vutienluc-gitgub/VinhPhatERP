import { Control, useFieldArray, UseFormRegister, UseFormWatch, Controller } from 'react-hook-form'
import { Plus, Trash2 } from '@/shared/icons'
import { Combobox } from '@/shared/components/Combobox'
import type { CreateWorkOrderInput } from './work-orders.module'
import { useYarnCatalogOptions } from '../yarn-catalog/useYarnCatalog'

interface WorkOrderYarnTableProps {
  control: Control<CreateWorkOrderInput>
  register: UseFormRegister<CreateWorkOrderInput>
  watch: UseFormWatch<CreateWorkOrderInput>
}

export function WorkOrderYarnTable({ control, register, watch }: WorkOrderYarnTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'yarn_requirements',
  })

  const { data: yarnOptions = [] } = useYarnCatalogOptions()
  
  return (
    <div className="panel-card card-flush" style={{ border: '1px solid var(--border)', marginTop: '1rem' }}>
      <div className="card-header-area" style={{ padding: '0.75rem 1rem', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Phân bổ sợi (Editable Table)</h4>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => append({ yarn_catalog_id: '', bom_ratio_pct: 0, required_kg: 0 })}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
          >
            <Plus style={{ width: 14, height: 14, marginRight: 4 }} />
            Thêm sợi
          </button>
        </div>
      </div>

      <div className="data-table-wrap" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table className="data-table table-sm">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Loại sợi</th>
              <th className="text-right" style={{ width: '20%' }}>% BOM</th>
              <th className="text-right" style={{ width: '25%' }}>Cần (kg)</th>
              <th style={{ width: '10%' }}></th>
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
                        options={yarnOptions.map(y => ({
                          value: y.id,
                          label: `${y.name} ${y.color_name ? `(${y.color_name})` : ''}`,
                          code: y.code
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
                    {...register(`yarn_requirements.${index}.bom_ratio_pct`, { valueAsNumber: true })}
                    className="field-input text-right"
                    style={{ padding: '0.25rem' }}
                    placeholder="%"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        const next = document.getElementsByName(`yarn_requirements.${index + 1}.bom_ratio_pct`)[0]
                        if (next) (next as HTMLInputElement).focus()
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        const prev = document.getElementsByName(`yarn_requirements.${index - 1}.bom_ratio_pct`)[0]
                        if (prev) (prev as HTMLInputElement).focus()
                      }
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`yarn_requirements.${index}.required_kg`, { valueAsNumber: true })}
                    className="field-input text-right"
                    style={{ padding: '0.25rem', fontWeight: 600, color: 'var(--primary)' }}
                    placeholder="kg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (index === fields.length - 1) {
                          append({ yarn_catalog_id: '', bom_ratio_pct: 0, required_kg: 0 })
                          setTimeout(() => {
                            const next = document.getElementsByName(`yarn_requirements.${index + 1}.bom_ratio_pct`)[0]
                            if (next) (next as HTMLInputElement).focus()
                          }, 10)
                        }
                      }
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        const next = document.getElementsByName(`yarn_requirements.${index + 1}.required_kg`)[0]
                        if (next) (next as HTMLInputElement).focus()
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        const prev = document.getElementsByName(`yarn_requirements.${index - 1}.required_kg`)[0]
                        if (prev) (prev as HTMLInputElement).focus()
                      }
                    }}
                  />
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => remove(index)}
                    style={{ color: 'var(--danger)', padding: 1 }}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--surface)', fontWeight: 700 }}>
              <td className="text-right">TỔNG:</td>
              <td className="text-right">
                {watch('yarn_requirements')?.reduce((sum, item) => sum + (Number(item.bom_ratio_pct) || 0), 0).toFixed(1)}%
              </td>
              <td className="text-right" style={{ color: 'var(--primary)' }}>
                {watch('yarn_requirements')?.reduce((sum, item) => sum + (Number(item.required_kg) || 0), 0).toFixed(2)} kg
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
        * Enter ở cột KG dòng cuối để thêm dòng mới. Mũi tên Lên/Xuống để di chuyển nhanh.
      </div>
    </div>
  )
}
