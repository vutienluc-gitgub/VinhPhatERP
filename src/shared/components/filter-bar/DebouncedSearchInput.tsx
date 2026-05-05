import { useState, useEffect } from 'react';

import { Icon } from '@/shared/components/Icon';

import { useDebouncedCallback } from './useDebouncedValue';

/** Thời gian debounce cho ô tìm kiếm (ms). Tránh magic number rải rắc. */
const SEARCH_DEBOUNCE_MS = 500;

interface DebouncedSearchInputProps {
  id: string;
  fieldKey: string;
  placeholder?: string;
  initialValue: string;
  onChange: (key: string, value: string) => void;
}

/**
 * DebouncedSearchInput - Ô tìm kiếm có chức năng "Trì hoãn thông minh" (Debounce).
 * Dùng useDebouncedCallback để giữ ổn định tham chiếu onChange, tránh bị reset timer liên tục.
 */
export function DebouncedSearchInput({
  id,
  fieldKey,
  placeholder,
  initialValue,
  onChange,
}: DebouncedSearchInputProps) {
  const [localValue, setLocalValue] = useState(initialValue);

  // Đồng bộ ngược từ ngoài vào (khi bấm Clear Filters)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // Debounced callback - chỉ gọi onChange sau khi ngừng type 500ms
  const debouncedOnChange = useDebouncedCallback(
    (key: string, value: string) => onChange(key, value),
    SEARCH_DEBOUNCE_MS,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(fieldKey, newValue);
  };

  return (
    <div className="search-input-wrapper">
      <input
        id={id}
        className="field-input"
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
      />
      <Icon name="Search" size={16} className="search-input-icon" />
    </div>
  );
}
