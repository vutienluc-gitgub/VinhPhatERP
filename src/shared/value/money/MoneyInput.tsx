import React from 'react';

import {
  NumericInput,
  NumericInputProps,
} from '@/shared/value/core/NumericInput';

export interface MoneyInputProps extends Omit<
  NumericInputProps,
  'formatOptions'
> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ suffix = 'đ', prefix, allowNegative = false, ...rest }, ref) => {
    return (
      <NumericInput
        ref={ref}
        formatOptions={{
          decimals: 0,
          suffix,
          prefix,
        }}
        allowNegative={allowNegative}
        {...rest}
      />
    );
  },
);
MoneyInput.displayName = 'MoneyInput';
