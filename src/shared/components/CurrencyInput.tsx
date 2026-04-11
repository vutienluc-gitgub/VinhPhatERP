import { memo, useCallback, useEffect, useRef, useState } from 'react';

/**
 * CurrencyInput — Format tiền tệ Việt Nam realtime khi gõ.
 *
 * - Hiển thị: "115.000" (có dấu chấm phân cách hàng nghìn)
 * - Giá trị thực gửi lên form: 115000 (number)
 * - Tương thích react-hook-form Controller pattern
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
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

/** Format number -> display string (VD: 115000 -> "115.000") */
function toDisplay(num: number): string {
  if (!num || num <= 0) return '';
  return new Intl.NumberFormat('vi-VN').format(num);
}

/** Parse display string -> number (VD: "115.000" -> 115000) */
function toNumber(text: string): number {
  const digits = text.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
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
  const [display, setDisplay] = useState(() => toDisplay(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync khi value thay đổi từ bên ngoài (edit mode, form reset)
  useEffect(() => {
    const currentNum = toNumber(display);
    if (value !== currentNum) {
      setDisplay(toDisplay(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawText = e.target.value;
      const cursorPos = e.target.selectionStart ?? 0;

      // Đếm số chữ số TRƯỚC con trỏ trong chuỗi gốc
      const digitsBeforeCursor = rawText
        .slice(0, cursorPos)
        .replace(/\D/g, '').length;

      // Parse -> format
      const numericValue = toNumber(rawText);
      const formatted = numericValue > 0 ? toDisplay(numericValue) : '';

      setDisplay(formatted);
      onChange(numericValue);

      // Phục hồi vị trí con trỏ sau khi React re-render
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
    [onChange],
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
