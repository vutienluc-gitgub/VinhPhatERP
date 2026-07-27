import { FieldValues } from 'react-hook-form';

import {
  NumericField,
  NumericFieldProps,
} from '@/shared/value/core/NumericField';

export interface LengthFieldProps<
  TFieldValues extends FieldValues,
> extends Omit<NumericFieldProps<TFieldValues>, 'formatOptions'> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export function LengthField<TFieldValues extends FieldValues>({
  suffix = 'm',
  prefix,
  allowNegative = false,
  ...rest
}: LengthFieldProps<TFieldValues>) {
  return (
    <NumericField
      formatOptions={{
        decimals: 2,
        prefix,
        suffix: suffix ? ` ${suffix}` : undefined,
      }}
      allowNegative={allowNegative}
      {...rest}
    />
  );
}
