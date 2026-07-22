import { Controller, useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import type { OrdersFormValues } from '@/schema/order.schema';
import { MoneyInput, QuantityInput } from '@/shared/value';
import { ORDERS_FORM_LABELS } from '@/features/orders/orders.constants';

const UNIT_LABELS: Record<string, string> = {
  m: 'm',
  kg: 'kg',
};

type ItemFieldsProps = {
  control: UseFormReturn<OrdersFormValues>['control'];
  index: number;
  register: UseFormReturn<OrdersFormValues>['register'];
  errors: UseFormReturn<OrdersFormValues>['formState']['errors'];
};

export function ItemQuantityFields({
  control,
  index,
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
      <Controller
        name={`items.${index}.quantity`}
        control={control}
        render={({ field }) => (
          <QuantityInput
            id={`items.${index}.quantity`}
            className={`field-input${errors.items?.[index]?.quantity ? ' border-danger' : ''}`}
            step="0.001"
            min="0"
            placeholder="0"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <div className="form-field">
        <label htmlFor={`items.${index}.unitPrice`}>
          {ORDERS_FORM_LABELS.FIELD_PRICE} (đ/{unitLabel}){' '}
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
              suffix={` đ/${unitLabel}`}
            />
          )}
        />
        {errors.items?.[index]?.unitPrice && (
          <span className="field-error">
            {errors.items[index]?.unitPrice?.message}
          </span>
        )}
      </div>
    </>
  );
}
