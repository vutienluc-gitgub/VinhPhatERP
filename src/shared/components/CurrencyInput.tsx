import { memo, useCallback, useRef } from 'react';

import { useControlledDisplay } from '@/shared/hooks/useControlledDisplay';

/**
 * CurrencyInput — Format tien te Viet Nam realtime khi go.
 *
 * - Hien thi: "115.000" (co dau cham phan cach hang nghin)
 * - Gia tri thuc gui len form: 115000 (number)
 * - Tuong thich react-hook-form Controller pattern
 *
 * @example
 * <Controller
 *   name="unitPrice"
 *   control={control}
 *   render={({ field }) => (
 *     <CurrencyInput
 *       value={field.value}
 *       onChange={field.onChange}
 *       onBlur={field.onBlur}
 *     />
 *   )}
 * />
 */

type CurrencyInputProps = {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

/** Format number -> display string (VD: 115000 -> "115.000") */
function toDisplay(num: number | null | undefined): string {
  if (num == null || num <= 0) return '';
  return new Intl.NumberFormat('vi-VN').format(num);
}

/** Parse display string -> number (VD: "115.000" -> 115000) */
function toNumber(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : null;
}

export const CurrencyInput = memo(function CurrencyInput({
  value,
  onChange,
  onBlur,
  id,
  className,
  placeholder = '0',
  disabled,
}: CurrencyInputProps) {
  const { display, setDisplay } = useControlledDisplay(
    value,
    toDisplay,
    toNumber,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawText = e.target.value;
      const cursorPos = e.target.selectionStart ?? 0;

      // Count digits BEFORE cursor in raw string
      const digitsBeforeCursor = rawText
        .slice(0, cursorPos)
        .replace(/\D/g, '').length;

      // Parse -> format
      const numericValue = toNumber(rawText) ?? 0;
      const formatted = numericValue > 0 ? toDisplay(numericValue) : '';

      setDisplay(formatted);
      onChange(numericValue);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;

        let digitCount = 0;
        let newPos = formatted.length;

        if (digitsBeforeCursor === 0) {
          newPos = 0;
        } else {
          for (let i = 0; i < formatted.length; i++) {
            const char = formatted.charAt(i);
            if (/\d/.test(char)) {
              digitCount++;
            }
            if (digitCount === digitsBeforeCursor) {
              newPos = i + 1;
              break;
            }
          }
        }

        el.setSelectionRange(newPos, newPos);
      });
    },
    [onChange, setDisplay],
  );

  return (
    <input
      ref={inputRef}
      id={id}
      className={className}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
    />
  );
});
