import { memo, useEffect, useState, useCallback } from 'react';

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
  const [isFocused, setIsFocused] = useState(false);

  // Derive local string for the native number input to hold while editing.
  // We only sync this from props when NOT focused, so we don't interrupt typing.
  const [localVal, setLocalVal] = useState<string>('');

  useEffect(() => {
    if (!isFocused) {
      setLocalVal(value != null ? String(value) : '');
    }
  }, [value, isFocused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setLocalVal(text);

      if (text.trim() === '') {
        onChange(null);
        return;
      }

      const parsed = parseFloat(text);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (onBlur) onBlur();
  }, [onBlur]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // When NOT focused, we display the strictly formatted locale string
  // (with thousands separators and decimal points matching VI locale)
  const displayValue =
    !isFocused && value != null
      ? new Intl.NumberFormat('vi-VN', {
          maximumFractionDigits: 4,
          minimumFractionDigits: 0,
        }).format(value)
      : localVal;

  return (
    <input
      id={id}
      className={className}
      type={isFocused ? 'number' : 'text'}
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
