import { useState, useEffect, useRef } from 'react';

import { Icon } from './Icon';
import { Combobox } from './Combobox';
import { ClearFilterButton } from './ClearFilterButton';

export type FilterFieldType = 'search' | 'combobox' | 'date' | 'date_range';

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

/** DX: Render 2 date input (from-to) trong 1 field group. */
export interface DateRangeFilterField extends FilterFieldBase {
  type: 'date_range';
  keyFrom: string;
  keyTo: string;
  labelFrom?: string;
  labelTo?: string;
}

export type FilterFieldConfig =
  | SearchFilterField
  | ComboboxFilterField
  | DateFilterField
  | DateRangeFilterField;

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

// ── Constants ───────────────────────────────────────────────────────────────
/** Thời gian debounce cho ô tìm kiếm (ms). Tránh magic number rải rắc. */
const SEARCH_DEBOUNCE_MS = 500;

// ── Sub-components ──────────────────────────────────────────────────────────

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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Đồng bộ ngược từ ngoài vào (khi bấm Clear Filters)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (localValue === initialValue) return;
    const timer = setTimeout(() => {
      onChangeRef.current(fieldKey, localValue);
    }, SEARCH_DEBOUNCE_MS);
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
 * FilterDateInput — Input date tái sử dụng cho cả date field và date_range.
 * Giải quyết duplicate JSX giữa keyFrom và keyTo trong date_range.
 */
function FilterDateInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <label
        htmlFor={id}
        className="text-[0.7rem] font-semibold text-muted uppercase tracking-wide"
      >
        {label}
      </label>
      <input
        id={id}
        className="field-input"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

/**
 * FilterBarPremium: Config-driven UI component
 * Giải quyết chuẩn cấu trúc "Thanh Bộ Lọc" đồng bộ toàn app.
 * Lập trình viên chỉ cần truyền file JSON (schema), hệ thống tự render đúng field type.
 *
 * @see useFilterState — Hook đóng gói state management cho component này.
 */
export function FilterBarPremium({
  schema,
  value,
  onChange,
  onClear,
}: FilterBarPremiumProps) {
  const hasActiveFilter = schema.some((field) => {
    if (field.type === 'date_range') {
      return (
        (value[field.keyFrom] ?? '') !== '' || (value[field.keyTo] ?? '') !== ''
      );
    }
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
            // A11Y: Combobox dùng <button> trigger — không thể dùng htmlFor.
            // Dùng aria-labelledby pattern theo WAI-ARIA spec.
            const labelId = `filter-label-${field.key}`;
            return (
              <div key={field.key} className="filter-field">
                <label id={labelId}>{field.label}</label>
                <Combobox
                  aria-labelledby={labelId}
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
                <FilterDateInput
                  id={`filter-${field.key}`}
                  label={field.label}
                  value={(value[field.key] as string) ?? ''}
                  onChange={(val) => onChange(field.key, val)}
                />
              </div>
            );
          }

          if (field.type === 'date_range') {
            return (
              <div
                key={field.key}
                className="filter-field"
                style={{ flex: '1 1 280px' }}
              >
                <label>{field.label}</label>
                <div className="flex items-center gap-2">
                  <FilterDateInput
                    id={`filter-${field.keyFrom}`}
                    label={field.labelFrom ?? 'Từ ngày'}
                    value={(value[field.keyFrom] as string) ?? ''}
                    onChange={(val) => onChange(field.keyFrom, val)}
                  />
                  <span className="text-muted mt-4 flex-shrink-0">→</span>
                  <FilterDateInput
                    id={`filter-${field.keyTo}`}
                    label={field.labelTo ?? 'Đến ngày'}
                    value={(value[field.keyTo] as string) ?? ''}
                    onChange={(val) => onChange(field.keyTo, val)}
                  />
                </div>
              </div>
            );
          }

          return null;
        })}

        {hasActiveFilter && onClear && <ClearFilterButton onClick={onClear} />}
      </div>
    </div>
  );
}
