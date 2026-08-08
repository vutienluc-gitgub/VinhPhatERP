import React, { useState, useEffect, useRef } from 'react';

import { cn } from '@/shared/utils/cn';

import { formatValue, ValueFormatterOptions } from './formatter';
import { parseNumericString } from './parser';

export interface NumericInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'prefix'
> {
  value?: number | null;
  onChange?: (val: number | null) => void;
  formatOptions?: ValueFormatterOptions;
  allowNegative?: boolean;
}

export const NumericInput = React.forwardRef<
  HTMLInputElement,
  NumericInputProps
>(
  (
    {
      value,
      onChange,
      formatOptions,
      allowNegative = false,
      className,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localText, setLocalText] = useState('');
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Combine refs
    const setRefs = React.useCallback(
      (node: HTMLInputElement) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    // Sync from prop value to local text when not focused
    useEffect(() => {
      if (!isFocused) {
        if (value === null || value === undefined) {
          setLocalText('');
        } else {
          // Format standard without prefix/suffix for the input value itself
          // The prefix/suffix will be rendered absolutely outside the native input text flow
          const text = formatValue(value, {
            ...formatOptions,
            prefix: '',
            suffix: '',
          });
          setLocalText(text);
        }
      }
    }, [value, isFocused, formatOptions]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // When focused, show raw number for easy editing (or keep decimals depending on type)
      if (value !== null && value !== undefined) {
        // e.g. "85000" instead of "85.000"
        // But if it's 12.5, it shows 12.5
        setLocalText(value.toString());
      } else {
        setLocalText('');
      }
      onFocus?.(e);
      // Focus cursor at the end
      setTimeout(() => {
        if (inputRef.current) {
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 0);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      const parsed = parseNumericString(localText);
      let finalValue = parsed;

      if (parsed !== null && !allowNegative && parsed < 0) {
        finalValue = Math.abs(parsed);
      }

      if (localText.trim() === '') {
        finalValue = null;
      }

      if (finalValue !== value) {
        onChange?.(finalValue);
      } else {
        // Re-format localText even if value didn't change
        if (value === null || value === undefined) {
          setLocalText('');
        } else {
          setLocalText(
            formatValue(value, { ...formatOptions, prefix: '', suffix: '' }),
          );
        }
      }
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalText(e.target.value);
    };

    const hasPrefix = !!formatOptions?.prefix;
    const hasSuffix = !!formatOptions?.suffix;

    return (
      <div className="relative flex items-center w-full">
        {hasPrefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none select-none text-sm z-10">
            {formatOptions.prefix}
          </span>
        )}
        <input
          ref={setRefs}
          type="text"
          inputMode="decimal"
          className={cn('field-input w-full', className)}
          style={{
            paddingLeft: hasPrefix ? '2.5rem' : undefined,
            paddingRight: hasSuffix ? '3rem' : undefined,
            textAlign: 'right', // right aligned for numbers
            fontVariantNumeric: 'tabular-nums',
          }}
          value={localText}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {hasSuffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none select-none text-sm z-10">
            {formatOptions.suffix}
          </span>
        )}
      </div>
    );
  },
);
NumericInput.displayName = 'NumericInput';
