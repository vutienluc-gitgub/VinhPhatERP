import React from 'react';

import {
  NumericInput,
  NumericInputProps,
} from '@/shared/value/core/NumericInput';

export interface DensityInputProps extends Omit<
  NumericInputProps,
  'formatOptions'
> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export const DensityInput = React.forwardRef<
  HTMLInputElement,
  DensityInputProps
>(({ suffix = 'gsm', prefix, allowNegative = false, ...rest }, ref) => {
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
});
DensityInput.displayName = 'DensityInput';
