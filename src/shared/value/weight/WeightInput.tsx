import React from 'react';

import {
  NumericInput,
  NumericInputProps,
} from '@/shared/value/core/NumericInput';

export interface WeightInputProps extends Omit<
  NumericInputProps,
  'formatOptions'
> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export const WeightInput = React.forwardRef<HTMLInputElement, WeightInputProps>(
  ({ suffix = 'kg', prefix, allowNegative = false, ...rest }, ref) => {
    return (
      <NumericInput
        ref={ref}
        formatOptions={{
          decimals: 2,
          suffix,
          prefix,
        }}
        allowNegative={allowNegative}
        {...rest}
      />
    );
  },
);
WeightInput.displayName = 'WeightInput';
