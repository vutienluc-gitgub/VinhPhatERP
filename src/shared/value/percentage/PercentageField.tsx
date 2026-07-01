import { FieldValues } from 'react-hook-form';

import {
  NumericField,
  NumericFieldProps,
} from '@/shared/value/core/NumericField';

export interface PercentageFieldProps<
  TFieldValues extends FieldValues,
> extends Omit<NumericFieldProps<TFieldValues>, 'formatOptions'> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export function PercentageField<TFieldValues extends FieldValues>({
  suffix = '%',
  prefix,
  allowNegative = false,
  ...rest
}: PercentageFieldProps<TFieldValues>) {
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
