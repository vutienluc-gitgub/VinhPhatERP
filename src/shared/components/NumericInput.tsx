import { memo, useCallback, useEffect, useRef, useState } from 'react';

/**
 * NumericInput — Format số realtime có hỗ trợ thập phân chuẩn Việt Nam.
 *
 * - Hiển thị: "1.500,5" (dấu chấm phân cách ngàn, phẩy phân cách thập phân)
 * - Tự động định dạng khi đang gõ.
 * - Cho phép nhập số thập phân chính xác.
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

// Format ra display chuẩn vi-VN
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
  const [display, setDisplay] = useState(() => toDisplay(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync khi value thay đổi từ bên ngoài
  useEffect(() => {
    const currentNum = toNumber(display);
    if (value !== currentNum && value != null) {
      setDisplay(toDisplay(value));
    } else if (value == null && display !== '') {
      setDisplay('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawText = e.target.value;
      const cursorPos = e.target.selectionStart ?? 0;

      // Numpad trên một số bàn phím gõ dấu chấm (.), ta ưu tiên biến nó thành dấu phẩy (,)
      // nếu nó là ký tự thập phân duy nhất hoặc vừa gõ. Nhưng để an toàn với paste,
      // ta chỉ xử lý nếu có chính xác 1 dấu chấm và không có dấu phẩy nào.
      if (rawText.includes('.') && !rawText.includes(',')) {
        const parts = rawText.split('.');
        if (parts.length === 2) {
          rawText = rawText.replace('.', ',');
        }
      }

      // Giữ lại các ký tự số và dấu phẩy
      const cleanText = rawText.replace(/[^\d,]/g, '');

      // Tách phần nguyên và phần thập phân (chỉ lấy dấu phẩy đầu tiên)
      const parts = cleanText.split(',');
      const intPart = parts[0];
      const decPart = parts.length > 1 ? parts.slice(1).join('') : null;

      let formatted = '';
      if (intPart) {
        // Format phần nguyên
        formatted = new Intl.NumberFormat('vi-VN').format(
          parseInt(intPart, 10) || 0,
        );
      }

      // Nối lại phần thập phân (ngay cả khi rỗng để giữ dấu phẩy khi user vừa gõ)
      if (decPart !== null) {
        formatted += ',' + decPart.slice(0, 4); // giới hạn 4 số lẻ
      }

      if (cleanText === '') {
        formatted = '';
      }

      setDisplay(formatted);
      onChange(toNumber(formatted));

      // Tính toán lại vị trí con trỏ
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
    [onChange],
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
