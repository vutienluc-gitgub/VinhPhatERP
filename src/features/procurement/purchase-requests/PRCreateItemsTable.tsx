import { useMemo } from 'react';
import {
  useFieldArray,
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form';

import { Button, Icon, Badge } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import type { PrHeaderFormValues } from '@/schema/purchase-request.schema';
import { useYarnCatalogOptions } from '@/shared/hooks/useYarnCatalogOptions';

import { PR_LABELS, UOM_OPTIONS } from './purchase-requests.constants';

type PRCreateItemsTableProps = {
  control: Control<PrHeaderFormValues>;
  register: UseFormRegister<PrHeaderFormValues>;
  errors: FieldErrors<PrHeaderFormValues>;
  setValue: UseFormSetValue<PrHeaderFormValues>;
};

export function PRCreateItemsTable({
  control,
  register,
  errors,
  setValue,
}: PRCreateItemsTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const { data: yarnCatalog = [] } = useYarnCatalogOptions();
  const yarnOptions = useMemo(
    () =>
      yarnCatalog.map((y) => ({
        value: y.name,
        label: y.name,
        code: y.code,
      })),
    [yarnCatalog],
  );

  return (
    <div className="panel-card">
      <div className="p-4 md:p-6 flex items-center justify-between border-b border-border">
        <h2 className="text-lg font-semibold">
          {PR_LABELS.ITEM_SECTION_TITLE}
        </h2>
        <Badge variant="info">{fields.length}</Badge>
      </div>

      {errors.items?.root && (
        <div className="px-4 md:px-6 pt-3">
          <p className="error-inline">{errors.items.root.message}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-subtle">
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium min-w-[180px]">
                {PR_LABELS.ITEM_MATERIAL_NAME}{' '}
                <span className="field-required">*</span>
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[140px]">
                {PR_LABELS.ITEM_SPECS}
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[100px]">
                {PR_LABELS.ITEM_QTY} <span className="field-required">*</span>
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[100px]">
                {PR_LABELS.ITEM_UOM} <span className="field-required">*</span>
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[130px]">
                {PR_LABELS.ITEM_EXPECTED_DATE}
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[160px]">
                {PR_LABELS.ITEM_PURPOSE}
              </th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const itemErrors = errors.items?.[index];
              return (
                <tr
                  key={field.id}
                  className="border-b border-border/50 hover:bg-surface-subtle/30 transition-colors"
                >
                  <td className="px-3 py-2 text-muted font-mono text-xs">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2">
                    <Controller
                      name={`items.${index}.material_name`}
                      control={control}
                      render={({ field: nameField }) => (
                        <Combobox
                          options={yarnOptions}
                          value={nameField.value}
                          onChange={(val) => {
                            nameField.onChange(val);
                            // Auto-fill specs & uom when a catalog item is selected
                            const selectedYarn = yarnCatalog.find(
                              (y) => y.name === val,
                            );
                            if (selectedYarn) {
                              if (selectedYarn.composition) {
                                setValue(
                                  `items.${index}.material_specs`,
                                  selectedYarn.composition,
                                );
                              }
                              if (selectedYarn.unit) {
                                setValue(
                                  `items.${index}.uom`,
                                  selectedYarn.unit,
                                );
                              }
                            }
                          }}
                          allowInput
                          placeholder={PR_LABELS.ITEM_MATERIAL_NAME_PLACEHOLDER}
                          hasError={!!itemErrors?.material_name}
                        />
                      )}
                    />
                    {itemErrors?.material_name && (
                      <span className="field-error text-xs">
                        {itemErrors.material_name.message}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      className="field-input text-sm"
                      placeholder={PR_LABELS.ITEM_SPECS_PLACEHOLDER}
                      {...register(`items.${index}.material_specs`)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`field-input text-sm${itemErrors?.qty_required ? ' is-error' : ''}`}
                      {...register(`items.${index}.qty_required`, {
                        valueAsNumber: true,
                      })}
                    />
                    {itemErrors?.qty_required && (
                      <span className="field-error text-xs">
                        {itemErrors.qty_required.message}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Controller
                      name={`items.${index}.uom`}
                      control={control}
                      render={({ field: uomField }) => (
                        <Combobox
                          options={UOM_OPTIONS}
                          value={uomField.value}
                          onChange={uomField.onChange}
                          hasError={!!itemErrors?.uom}
                        />
                      )}
                    />
                    {itemErrors?.uom && (
                      <span className="field-error text-xs">
                        {itemErrors.uom.message}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      className="field-input text-sm"
                      {...register(`items.${index}.expected_date`)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      className="field-input text-sm"
                      placeholder={PR_LABELS.ITEM_PURPOSE_PLACEHOLDER}
                      {...register(`items.${index}.purpose`)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                        title={PR_LABELS.ITEM_REMOVE}
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
        </table>
      </div>

      <div className="p-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({
              material_name: '',
              material_specs: '',
              qty_required: 0,
              uom: 'kg',
              expected_date: '',
              purpose: '',
            })
          }
        >
          <Icon name="Plus" size={16} className="mr-1.5" />
          {PR_LABELS.ITEM_ADD}
        </Button>
      </div>
    </div>
  );
}
