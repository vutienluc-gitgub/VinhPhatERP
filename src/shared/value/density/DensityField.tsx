import { FieldValues } from 'react-hook-form';

import {
  NumericField,
  NumericFieldProps,
} from '@/shared/value/core/NumericField';

export interface DensityFieldProps<
  TFieldValues extends FieldValues,
> extends Omit<NumericFieldProps<TFieldValues>, 'formatOptions'> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export function DensityField<TFieldValues extends FieldValues>({
  suffix = 'gsm',
  prefix,
  allowNegative = false,
  ...rest
}: DensityFieldProps<TFieldValues>) {
  return (
    <NumericField
      formatOptions={{
        decimals: 0,
        suffix,
        prefix,
      }}
      allowNegative={allowNegative}
      {...rest}
    />
  );
}
