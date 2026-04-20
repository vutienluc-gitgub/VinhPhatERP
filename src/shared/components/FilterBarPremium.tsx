import { useState, useEffect, useRef } from 'react';

import { Icon } from './Icon';
import { Combobox } from './Combobox';
import { ClearFilterButton } from './ClearFilterButton';

export type FilterFieldType = 'search' | 'combobox' | 'date';

export interface FilterFieldBase {
  key: string;
  label: string;
  type: FilterFieldType;
}

export interface SearchFilterField extends FilterFieldBase {
  type: 'search';
  placeholder?: string;
}

export interface ComboboxFilterField extends FilterFieldBase {
  type: 'combobox';
  options: { value: string; label: string; icon?: string }[];
}

export interface DateFilterField extends FilterFieldBase {
  type: 'date';
}

export type FilterFieldConfig =
  | SearchFilterField
  | ComboboxFilterField
  | DateFilterField;

interface FilterBarPremiumProps {
  /** Mảng cấu hình các trường lọc */
  schema: FilterFieldConfig[];
  /** Giá trị của các trường lọc (state) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any>;
  /** Hàm callback khi có trường bộ lọc thay đổi */
  onChange: (key: string, val: string | undefined) => void;
  /** Hàm callback khi bấm "Xóa bộ lọc". Nếu có biến onClear, nút xoá mới hiện. */
  onClear?: () => void;
}

/**
 * DebouncedSearchInput - Ô tìm kiếm có chức năng "Trì hoãn thông minh" (Debounce).
 * Dùng useRef để giữ ổn định tham chiếu onChange, tránh bị reset timer liên tục.
 */
function DebouncedSearchInput({
  id,
  fieldKey,
  placeholder,
  initialValue,
  onChange,
}: {
  id: string;
  fieldKey: string;
  placeholder?: string;
  initialValue: string;
  onChange: (key: string, value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(initialValue);
  // Lưu callback bằng Ref để tránh bị reset timer khi parent re-render
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Đồng bộ ngược từ ngoài vào (khi bấm Clear Filters)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // Bộ đếm Debounce 500ms - chỉ phụ thuộc vào localValue và initialValue
  useEffect(() => {
    if (localValue === initialValue) return;
    const timer = setTimeout(() => {
      onChangeRef.current(fieldKey, localValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [localValue, initialValue, fieldKey]);

  return (
    <div className="search-input-wrapper">
      <input
        id={id}
        className="field-input"
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
      <Icon name="Search" size={16} className="search-input-icon" />
    </div>
  );
}

/**
 * FilterBarPremium: Config-driven UI component
 * Giải quyết chuẩn cấu trúc "Thanh Bộ Lọc" đồng bộ toàn app.
 * Lập trình viên chỉ cần truyền file JSON (schema), hệ thống tự đẻ ra CSS/Input/Combobox chuẩn.
 */
export function FilterBarPremium({
  schema,
  value,
  onChange,
  onClear,
}: FilterBarPremiumProps) {
  // Kiểm tra xem hiện tại user có đang điền bất kỳ filters nào chưa (để kích hoạt nút Clear)
  const hasActiveFilter = schema.some((field) => {
    const val = value[field.key];
    return val !== undefined && val !== '' && val !== null;
  });

  return (
    <div className="filter-bar card-filter-section p-4 border-b border-border">
      <div className="filter-compact-premium">
        {schema.map((field) => {
          if (field.type === 'search') {
            return (
              <div key={field.key} className="filter-field">
                <label htmlFor={`filter-${field.key}`}>{field.label}</label>
                <DebouncedSearchInput
                  id={`filter-${field.key}`}
                  fieldKey={field.key}
                  placeholder={
                    field.placeholder ||
                    `Tìm kiếm ${field.label.toLowerCase()}...`
                  }
                  initialValue={value[field.key] || ''}
                  onChange={onChange}
                />
              </div>
            );
          }

          if (field.type === 'combobox') {
            return (
              <div key={field.key} className="filter-field">
                <label>{field.label}</label>
                <Combobox
                  options={[
                    {
                      value: '',
                      label: `Tất cả ${field.label.toLowerCase()}`,
                    },
                    ...field.options,
                  ]}
                  value={(value[field.key] as string) ?? ''}
                  onChange={(val) => onChange(field.key, val || undefined)}
                />
              </div>
            );
          }

          if (field.type === 'date') {
            return (
              <div key={field.key} className="filter-field">
                <label>{field.label}</label>
                <input
                  className="field-input"
                  type="date"
                  value={(value[field.key] as string) ?? ''}
                  onChange={(e) =>
                    onChange(field.key, e.target.value || undefined)
                  }
                />
              </div>
            );
          }

          return null; // Ignore unknown types
        })}

        {/* Nút Clear Filters */}
        {hasActiveFilter && onClear && <ClearFilterButton onClick={onClear} />}
      </div>
    </div>
  );
}
