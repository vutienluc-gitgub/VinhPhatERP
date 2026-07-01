import { FieldValues } from 'react-hook-form';

import {
  NumericField,
  NumericFieldProps,
} from '@/shared/value/core/NumericField';

export interface MoneyFieldProps<TFieldValues extends FieldValues> extends Omit<
  NumericFieldProps<TFieldValues>,
  'formatOptions'
> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export function MoneyField<TFieldValues extends FieldValues>({
  suffix = 'đ',
  prefix,
  allowNegative = false,
  ...rest
}: MoneyFieldProps<TFieldValues>) {
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
