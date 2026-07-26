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
    <div className="flex items-center gap-2 w-full">
      <NumericField
        formatOptions={{
          decimals: 2,
          prefix,
        }}
        allowNegative={allowNegative}
        {...rest}
      />
      {suffix && (
        <span className="text-muted text-sm whitespace-nowrap">{suffix}</span>
      )}
    </div>
  );
}
