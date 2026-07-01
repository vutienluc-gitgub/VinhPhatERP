import { FieldValues } from 'react-hook-form';

import {
  NumericField,
  NumericFieldProps,
} from '@/shared/value/core/NumericField';

export interface QuantityFieldProps<
  TFieldValues extends FieldValues,
> extends Omit<NumericFieldProps<TFieldValues>, 'formatOptions'> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
  decimals?: number;
}

export function QuantityField<TFieldValues extends FieldValues>({
  suffix = '',
  prefix,
  allowNegative = false,
  decimals = 0,
  ...rest
}: QuantityFieldProps<TFieldValues>) {
  return (
    <NumericField
      formatOptions={{
        decimals,
        suffix,
        prefix,
      }}
      allowNegative={allowNegative}
      {...rest}
    />
  );
}
