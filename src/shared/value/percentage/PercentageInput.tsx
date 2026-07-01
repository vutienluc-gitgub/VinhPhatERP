import React from 'react';

import {
  NumericInput,
  NumericInputProps,
} from '@/shared/value/core/NumericInput';

export interface PercentageInputProps extends Omit<
  NumericInputProps,
  'formatOptions'
> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export const PercentageInput = React.forwardRef<
  HTMLInputElement,
  PercentageInputProps
>(({ suffix = '%', prefix, allowNegative = false, ...rest }, ref) => {
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
});
PercentageInput.displayName = 'PercentageInput';
