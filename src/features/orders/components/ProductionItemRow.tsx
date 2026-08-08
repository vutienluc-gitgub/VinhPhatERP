import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import type { OrdersFormValues } from '@/schema/order.schema';
import { ORDERS_FORM_LABELS } from '@/features/orders/orders.constants';

import { ItemQuantityFields } from './ItemQuantityFields';

type ProductionItemRowProps = {
  index: number;
  control: UseFormReturn<OrdersFormValues>['control'];
  setValue: UseFormReturn<OrdersFormValues>['setValue'];
  register: UseFormReturn<OrdersFormValues>['register'];
  errors: UseFormReturn<OrdersFormValues>['formState']['errors'];
  fabricComboOptions: { value: string; label: string; code?: string }[];
  fabricOptions: { name: string; code?: string; unit?: string }[];
  colorComboOptions: { value: string; label: string }[];
  unitComboOptions: { value: string; label: string }[];
  onRemove: () => void;
  canRemove: boolean;
};

export function ProductionItemRow({
  index,
  control,
  setValue,
  register,
  errors,
  fabricComboOptions,
  fabricOptions,
  colorComboOptions,
  unitComboOptions,
  onRemove,
  canRemove,
}: ProductionItemRowProps) {
  return (
    <div className="form-item-box">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <span className="text-sm font-semibold text-muted-foreground">
          {ORDERS_FORM_LABELS.ITEM_ROW_PREFIX}
          {index + 1}
        </span>
        {canRemove && (
          <button
            className="btn-icon danger"
            type="button"
            title={ORDERS_FORM_LABELS.BTN_REMOVE_TITLE}
            onClick={onRemove}
          >
            {ORDERS_FORM_LABELS.BTN_REMOVE}
          </button>
        )}
      </div>

      <div className="form-grid">
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <div className="form-field">
            <label htmlFor={`items.${index}.fabricType`}>
              {ORDERS_FORM_LABELS.FIELD_FABRIC_TYPE}{' '}
              <span className="field-required">*</span>
            </label>
            <Controller
              name={`items.${index}.fabricType` as const}
              control={control}
              render={({ field }) => (
                <Combobox
                  options={fabricComboOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    const selected = fabricOptions.find((f) => f.name === val);
                    if (selected?.unit) {
                      setValue(
                        `items.${index}.unit`,
                        selected.unit as 'm' | 'kg',
                      );
                    }
                  }}
                  placeholder={ORDERS_FORM_LABELS.PLACEHOLDER_FABRIC}
                  hasError={!!errors.items?.[index]?.fabricType}
                />
              )}
            />
            {errors.items?.[index]?.fabricType && (
              <span className="field-error">
                {errors.items[index].fabricType?.message}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={`items.${index}.colorName`}>
              {ORDERS_FORM_LABELS.FIELD_COLOR}
            </label>
            <Controller
              name={`items.${index}.colorName` as const}
              control={control}
              render={({ field }) => (
                <Combobox
                  options={colorComboOptions}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder={ORDERS_FORM_LABELS.PLACEHOLDER_COLOR}
                  hasError={!!errors.items?.[index]?.colorName}
                />
              )}
            />
            {errors.items?.[index]?.colorName && (
              <span className="field-error">
                {errors.items[index]?.colorName?.message as string}
              </span>
            )}
          </div>
        </div>

        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
          <div className="form-field">
            <label htmlFor={`items.${index}.colorCode`}>
              {ORDERS_FORM_LABELS.FIELD_COLOR_CODE}
            </label>
            <input
              id={`items.${index}.colorCode`}
              className="field-input"
              type="text"
              placeholder={ORDERS_FORM_LABELS.PLACEHOLDER_COLOR_CODE}
              {...register(`items.${index}.colorCode`)}
            />
          </div>
          <div className="form-field">
            <label htmlFor={`items.${index}.unit`}>
              {ORDERS_FORM_LABELS.FIELD_UNIT}
            </label>
            <Controller
              name={`items.${index}.unit` as const}
              control={control}
              render={({ field }) => (
                <Combobox
                  options={unitComboOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <ItemQuantityFields
            control={control}
            index={index}
            register={register}
            errors={errors}
          />
        </div>
      </div>
    </div>
  );
}
