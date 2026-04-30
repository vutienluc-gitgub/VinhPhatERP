import { memo, useCallback } from 'react';

import { useControlledDisplay } from '@/shared/hooks/useControlledDisplay';

type NumberInputProps = {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  readOnly?: boolean;
};

/** Format for unfocused display — vi-VN locale with thousands separators */
function toDisplay(num: number | null | undefined): string {
  if (num == null) return '';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  }).format(num);
}

/** Parse raw text input to number */
function toNumber(text: string): number | null {
  if (!text || text.trim() === '') return null;
  const parsed = parseFloat(text);
  return isNaN(parsed) ? null : parsed;
}

export const NumberInput = memo(function NumberInput({
  value,
  onChange,
  onBlur,
  id,
  className,
  placeholder = '0',
  disabled,
  min = 0,
  max,
  step = 'any',
  readOnly,
}: NumberInputProps) {
  const { display, setDisplay, isFocusedRef } = useControlledDisplay(
    value,
    toDisplay,
    toNumber,
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setDisplay(text);

      if (text.trim() === '') {
        onChange(null);
        return;
      }

      const parsed = parseFloat(text);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    },
    [onChange, setDisplay],
  );

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    if (onBlur) onBlur();
  }, [onBlur, isFocusedRef]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    // When focusing, switch to raw number for native number input editing
    setDisplay(value != null ? String(value) : '');
  }, [isFocusedRef, setDisplay, value]);

  // When NOT focused, we display the strictly formatted locale string
  // (with thousands separators and decimal points matching VI locale)
  const displayValue =
    !isFocusedRef.current && value != null ? toDisplay(value) : display;

  return (
    <input
      id={id}
      className={className}
      type={isFocusedRef.current ? 'number' : 'text'}
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete="off"
    />
  );
});
