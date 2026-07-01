import React from 'react';

import {
  NumericInput,
  NumericInputProps,
} from '@/shared/value/core/NumericInput';

export interface LengthInputProps extends Omit<
  NumericInputProps,
  'formatOptions'
> {
  suffix?: string;
  prefix?: string;
  allowNegative?: boolean;
}

export const LengthInput = React.forwardRef<HTMLInputElement, LengthInputProps>(
  ({ suffix = 'm', prefix, allowNegative = false, ...rest }, ref) => {
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
LengthInput.displayName = 'LengthInput';
