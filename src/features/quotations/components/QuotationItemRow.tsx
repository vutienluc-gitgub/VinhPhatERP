import { useWatch, Controller } from 'react-hook-form';
import type { UseFieldArrayRemove, useForm } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import { Icon } from '@/shared/components/Icon';
import { MoneyInput } from '@/shared/value';
import { UNIT_OPTIONS } from '@/schema/quotation.schema';
import type { QuotationsFormValues } from '@/schema/quotation.schema';
import {
  QUOTATION_LABELS,
  QUOTATION_PLACEHOLDERS,
} from '@/features/quotations/quotations.constants';

const UNIT_LABELS: Record<string, string> = {
  m: 'm',
  kg: 'kg',
};

const UNIT_COMBO_OPTIONS = UNIT_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

type ItemFieldsProps = {
  control: ReturnType<typeof useForm<QuotationsFormValues>>['control'];
  index: number;
  register: ReturnType<typeof useForm<QuotationsFormValues>>['register'];
  errors: ReturnType<
    typeof useForm<QuotationsFormValues>
  >['formState']['errors'];
};

export function QuotationItemQuantityFields({
  control,
  index,
  register,
  errors,
}: ItemFieldsProps) {
  const unit =
    useWatch({
      control,
      name: `items.${index}.unit`,
    }) ?? 'm';
  const unitLabel = UNIT_LABELS[unit] ?? unit;

  return (
    <>
      <div className="form-field">
        <label htmlFor={`items.${index}.quantity`}>
          {QUOTATION_LABELS.QUANTITY} ({unitLabel}){' '}
          <span className="field-required">*</span>
        </label>
        <input
          id={`items.${index}.quantity`}
          className={`field-input${errors.items?.[index]?.quantity ? ' border-danger' : ''}`}
          type="number"
          step="0.001"
          min="0"
          placeholder="0"
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
        />
        {errors.items?.[index]?.quantity && (
          <span className="field-error">
            {errors.items[index].quantity.message}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor={`items.${index}.unitPrice`}>
          {QUOTATION_LABELS.UNIT_PRICE} (đ/{unitLabel}){' '}
          <span className="field-required">*</span>
        </label>
        <Controller
          name={`items.${index}.unitPrice` as const}
          control={control}
          render={({ field }) => (
            <MoneyInput
              id={`items.${index}.unitPrice`}
              className={`field-input${errors.items?.[index]?.unitPrice ? ' border-danger' : ''}`}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="0"
            />
          )}
        />
        {errors.items?.[index]?.unitPrice && (
          <span className="field-error">
            {errors.items[index].unitPrice.message}
          </span>
        )}
      </div>
    </>
  );
}

type QuotationItemProps = {
  index: number;
  control: ReturnType<typeof useForm<QuotationsFormValues>>['control'];
  register: ReturnType<typeof useForm<QuotationsFormValues>>['register'];
  errors: ReturnType<
    typeof useForm<QuotationsFormValues>
  >['formState']['errors'];
  setValue: ReturnType<typeof useForm<QuotationsFormValues>>['setValue'];
  remove: UseFieldArrayRemove;
  fabricComboOptions: { value: string; label: string; code?: string }[];
  fabricOptions: { name: string; unit?: string | null }[];
  colorOptions: { value: string; label: string }[];
};

export function QuotationItemRow({
  index,
  control,
  register,
  errors,
  setValue,
  remove,
  fabricComboOptions,
  fabricOptions,
  colorOptions,
}: QuotationItemProps) {
  return (
    <div className="border border-border rounded-lg p-3 bg-surface">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[0.85rem] font-bold text-muted uppercase tracking-wider">
          {QUOTATION_LABELS.LINE} {index + 1}
        </span>
        <button
          className="btn-icon text-danger"
          type="button"
          title={QUOTATION_LABELS.BTN_DELETE}
          onClick={() => remove(index)}
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      <div className="form-grid form-grid-2">
        <div className="form-field">
          <label htmlFor={`items.${index}.fabricType`}>
            {QUOTATION_LABELS.FABRIC_TYPE}{' '}
            <span className="field-required">*</span>
          </label>
          <Controller
            name={`items.${index}.fabricType` as const}
            control={control}
            render={({ field }) => {
              return (
                <Combobox
                  options={fabricComboOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    // Auto-fill unit from catalog
                    const selected = fabricOptions.find((f) => f.name === val);
                    if (selected?.unit) {
                      setValue(
                        `items.${index}.unit`,
                        selected.unit as 'm' | 'kg',
                      );
                    }
                  }}
                  placeholder={QUOTATION_PLACEHOLDERS.FABRIC_TYPE}
                  hasError={!!errors.items?.[index]?.fabricType}
                />
              );
            }}
          />
          {errors.items?.[index]?.fabricType && (
            <span className="field-error">
              {errors.items[index].fabricType.message}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.colorName`}>
            {QUOTATION_LABELS.COLOR}
          </label>
          <Controller
            name={`items.${index}.colorName` as const}
            control={control}
            render={({ field }) => (
              <Combobox
                options={colorOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder={QUOTATION_PLACEHOLDERS.COLOR}
              />
            )}
          />
        </div>
      </div>

      <div className="form-grid form-grid-2">
        <div className="form-field">
          <label htmlFor={`items.${index}.colorCode`}>
            {QUOTATION_LABELS.COLOR_CODE}
          </label>
          <input
            id={`items.${index}.colorCode`}
            className="field-input"
            type="text"
            placeholder={QUOTATION_PLACEHOLDERS.COLOR_CODE}
            {...register(`items.${index}.colorCode`)}
          />
        </div>

        <div className="form-grid form-grid-2">
          <div className="form-field">
            <label htmlFor={`items.${index}.widthCm`}>
              {QUOTATION_LABELS.WIDTH}
            </label>
            <input
              id={`items.${index}.widthCm`}
              className="field-input"
              type="number"
              step="0.01"
              min="0"
              placeholder={QUOTATION_PLACEHOLDERS.WIDTH}
              {...register(`items.${index}.widthCm`, {
                valueAsNumber: true,
              })}
            />
          </div>
          <div className="form-field">
            <label htmlFor={`items.${index}.unit`}>
              {QUOTATION_LABELS.UNIT}
            </label>
            <Controller
              name={`items.${index}.unit` as const}
              control={control}
              render={({ field }) => (
                <Combobox
                  options={UNIT_COMBO_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="form-grid form-grid-2">
        <QuotationItemQuantityFields
          control={control}
          index={index}
          register={register}
          errors={errors}
        />
      </div>

      <div className="form-grid form-grid-2">
        <div className="form-field">
          <label htmlFor={`items.${index}.leadTimeDays`}>
            {QUOTATION_LABELS.LEAD_TIME}
          </label>
          <input
            id={`items.${index}.leadTimeDays`}
            className="field-input"
            type="number"
            min="0"
            placeholder="15"
            {...register(`items.${index}.leadTimeDays`, {
              valueAsNumber: true,
            })}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`items.${index}.notes`}>
            {QUOTATION_LABELS.NOTES_LINE}
          </label>
          <input
            id={`items.${index}.notes`}
            className="field-input"
            type="text"
            placeholder={QUOTATION_PLACEHOLDERS.NOTES_LINE}
            {...register(`items.${index}.notes`)}
          />
        </div>
      </div>
    </div>
  );
}
