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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Thông tin chung
        </h3>
      </div>

      <div className="form-grid sm:grid-cols-2">
        <div className="form-field sm:col-span-2">
          <label>
            {LABELS.FABRIC_TYPE} <span className="field-required">*</span>
          </label>
          <div className="flex items-center gap-6 mt-1 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="knitted"
                {...register('fabric_type')}
                className="w-4 h-4 text-primary focus:ring-primary border-muted"
                disabled={!isEditing}
              />
              <span className="text-sm font-medium text-secondary">
                {LABELS.KNITTED}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="woven"
                {...register('fabric_type')}
                className="w-4 h-4 text-primary focus:ring-primary border-muted"
                disabled={!isEditing}
              />
              <span className="text-sm font-medium text-secondary">
                {LABELS.WOVEN}
              </span>
            </label>
          </div>
        </div>

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
                    name={
                      `composition_parts.${index}.percentage` as `composition_parts.${number}.percentage`
                    }
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
    </div>
  );
}
