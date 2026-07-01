import React from 'react';

import {
  NumericInput,
  NumericInputProps,
} from '@/shared/value/core/NumericInput';

export interface QuantityInputProps extends Omit<
  NumericInputProps,
  'formatOptions'
> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
  decimals?: number;
}

export const QuantityInput = React.forwardRef<
  HTMLInputElement,
  QuantityInputProps
>(
  (
    { suffix = '', prefix, allowNegative = false, decimals = 0, ...rest },
    ref,
  ) => {
    return (
      <NumericInput
        ref={ref}
        formatOptions={{
          decimals,
          suffix,
          prefix,
        }}
        allowNegative={allowNegative}
        {...rest}
      />
    );
  },
);
QuantityInput.displayName = 'QuantityInput';
