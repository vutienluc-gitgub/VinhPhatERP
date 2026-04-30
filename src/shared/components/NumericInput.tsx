import { memo, useCallback, useRef } from 'react';

import { useControlledDisplay } from '@/shared/hooks/useControlledDisplay';

/**
 * NumericInput — Format so realtime co ho tro thap phan chuan Viet Nam.
 *
 * - Hien thi: "1.500,5" (dau cham phan cach ngan, phay phan cach thap phan)
 * - Tu dong dinh dang khi dang go.
 * - Cho phep nhap so thap phan chinh xac.
 */

type NumericInputProps = {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

// Format ra display chuan vi-VN
function toDisplay(num: number | null | undefined): string {
  if (num == null) return '';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 4,
  }).format(num);
}

// Convert "1.500.000,123" -> 1500000.123
function toNumber(text: string): number | null {
  if (!text || text.trim() === '') return null;
  const noDots = text.replace(/\./g, '');
  const standardForm = noDots.replace(/,/g, '.');
  const parsed = parseFloat(standardForm);
  return isNaN(parsed) ? null : parsed;
}

export const NumericInput = memo(function NumericInput({
  value,
  onChange,
  onBlur,
  id,
  className,
  placeholder = '0',
  disabled,
  readOnly,
}: NumericInputProps) {
  const { display, setDisplay } = useControlledDisplay(
    value,
    toDisplay,
    toNumber,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawText = e.target.value;
      const cursorPos = e.target.selectionStart ?? 0;

      // Numpad tren mot so ban phim go dau cham (.), ta uu tien bien no thanh dau phay (,)
      // neu no la ky tu thap phan duy nhat hoac vua go. Nhung de an toan voi paste,
      // ta chi xu ly neu co chinh xac 1 dau cham va khong co dau phay nao.
      if (rawText.includes('.') && !rawText.includes(',')) {
        const parts = rawText.split('.');
        if (parts.length === 2) {
          rawText = rawText.replace('.', ',');
        }
      }

      // Giu lai cac ky tu so va dau phay
      const cleanText = rawText.replace(/[^\d,]/g, '');

      // Tach phan nguyen va phan thap phan (chi lay dau phay dau tien)
      const parts = cleanText.split(',');
      const intPart = parts[0];
      const decPart = parts.length > 1 ? parts.slice(1).join('') : null;

      let formatted = '';
      if (intPart) {
        // Format phan nguyen
        formatted = new Intl.NumberFormat('vi-VN').format(
          parseInt(intPart, 10) || 0,
        );
      }

      // Noi lai phan thap phan (ngay ca khi rong de giu dau phay khi user vua go)
      if (decPart !== null) {
        formatted += ',' + decPart.slice(0, 4); // gioi han 4 so le
      }

      if (cleanText === '') {
        formatted = '';
      }

      setDisplay(formatted);
      onChange(toNumber(formatted));

      // Tinh toan lai vi tri con tro
      const charsBeforeCursorRaw = rawText.slice(0, cursorPos);
      const digitsBeforeCursor = charsBeforeCursorRaw.replace(
        /[^\d,]/g,
        '',
      ).length;

      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;

        let count = 0;
        let newPos = formatted.length;

        if (digitsBeforeCursor === 0) {
          newPos = 0;
        } else {
          for (let i = 0; i < formatted.length; i++) {
            const char = formatted.charAt(i);
            if (/\d|,/.test(char)) {
              count++;
            }
            if (count === digitsBeforeCursor) {
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
      inputMode="decimal"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
});
