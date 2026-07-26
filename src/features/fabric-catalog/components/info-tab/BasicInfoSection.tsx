import { useFormContext, Controller, useFieldArray } from 'react-hook-form';

import { Combobox, Button, Icon } from '@/shared/components';
import { PercentageField } from '@/shared/value/percentage/PercentageField';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalog } from '@/features/fabric-catalog/types';

type BasicInfoSectionProps = {
  catalog: FabricCatalog | null;
  isEditing: boolean;
  categoryOptions: { value: string; label: string }[];
};

export function BasicInfoSection({
  catalog,
  isEditing,
  categoryOptions,
}: BasicInfoSectionProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'composition_parts',
  });

  return (
    <fieldset className="border border-slate-200 p-4 rounded-md mb-6 relative mt-4">
      <legend className="text-sm font-semibold px-2 text-slate-700">
        Thông tin chung
      </legend>

      <div className="form-grid sm:grid-cols-2">
        <div className="form-field">
          <label htmlFor="fc-code">
            {LABELS.CODE} <span className="field-required">*</span>
          </label>
          <input
            id="fc-code"
            className={`field-input${errors.code ? ' border-danger' : ''}`}
            type="text"
            placeholder={LABELS.CODE_PLACEHOLDER}
            readOnly={!isEditing}
            {...register('code')}
          />
          {errors.code && (
            <span className="field-error">{errors.code.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="fc-name">
            {LABELS.NAME} <span className="field-required">*</span>
          </label>
          <input
            id="fc-name"
            className={`field-input${errors.name ? ' border-danger' : ''}`}
            type="text"
            placeholder={LABELS.NAME_PLACEHOLDER}
            {...register('name')}
          />
          {errors.name && (
            <span className="field-error">{errors.name.message}</span>
          )}
        </div>
      </div>

      <div className="form-grid sm:grid-cols-2 mt-4">
        <div className="form-field">
          <label>{LABELS.CATEGORY}</label>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <Combobox
                options={categoryOptions}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                hasError={!!errors.category_id}
                placeholder={LABELS.CATEGORY_PLACEHOLDER}
              />
            )}
          />
          {errors.category_id && (
            <span className="field-error">{errors.category_id.message}</span>
          )}
        </div>

        <div className="form-field">
          <label>{LABELS.COMPOSITION}</label>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    className="field-input w-full"
                    placeholder="VD: Cotton, Polyester..."
                    {...register(`composition_parts.${index}.fiber`)}
                  />
                  {errors.composition_parts?.[index]?.fiber && (
                    <span className="field-error text-xs">
                      {errors.composition_parts[index]?.fiber?.message}
                    </span>
                  )}
                </div>
                <div className="w-24">
                  <PercentageField
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    name={`composition_parts.${index}.percentage` as any}
                    control={control}
                    placeholder="%"
                  />
                </div>
                <Button
                  variant="ghost"
                  type="button"
                  size="icon"
                  className="text-muted-foreground hover:text-danger shrink-0"
                  onClick={() => remove(index)}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => append({ fiber: '', percentage: 0 })}
            >
              <Icon name="plus" className="h-4 w-4 mr-2" />
              Thêm thành phần sợi
            </Button>
            {catalog?.composition && fields.length === 0 && (
              <p className="text-xs text-muted mt-1">
                {LABELS.OLD_DATA_HINT}
                {catalog.composition}
              </p>
            )}
          </div>
        </div>
      </div>
    </fieldset>
  );
}
