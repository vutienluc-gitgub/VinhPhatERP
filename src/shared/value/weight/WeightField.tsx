import { FieldValues } from 'react-hook-form';

import {
  NumericField,
  NumericFieldProps,
} from '@/shared/value/core/NumericField';

export interface WeightFieldProps<
  TFieldValues extends FieldValues,
> extends Omit<NumericFieldProps<TFieldValues>, 'formatOptions'> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export function WeightField<TFieldValues extends FieldValues>({
  suffix = 'kg',
  prefix,
  allowNegative = false,
  ...rest
}: WeightFieldProps<TFieldValues>) {
  return (
    <NumericField
      formatOptions={{
        decimals: 2,
        suffix,
        prefix,
      }}
      allowNegative={allowNegative}
      {...rest}
    />
  );
}
