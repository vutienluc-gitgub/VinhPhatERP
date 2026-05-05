/**
 * Field Renderers Registry (Strategy Pattern)
 *
 * Registry Pattern mapping field types to their React rendering implementations.
 * Resolves Open/Closed Principle (OCP) violation: To add a new filter type,
 * you simply register it here without touching the main component logic.
 */

import { Combobox } from '@/shared/components/Combobox';

import { DebouncedSearchInput } from './DebouncedSearchInput';
import { FilterDateInput } from './FilterDateInput';
import {
  FieldRenderersRegistry,
  isSearchFilterField,
  isComboboxFilterField,
  isDateRangeFilterField,
} from './types';

/**
 * Registry của tất cả field renderers.
 * Mỗi field type có một React component tương ứng.
 */
export const FieldRenderers: FieldRenderersRegistry = {
  search: ({ field, value, onChange, idPrefix }) => {
    if (!isSearchFilterField(field)) return null;
    const inputId = `${idPrefix}${field.key}`;
    return (
      <div className="filter-field">
        <label htmlFor={inputId}>{field.label}</label>
        <DebouncedSearchInput
          id={inputId}
          fieldKey={field.key}
          placeholder={
            field.placeholder || `Tìm kiếm ${field.label.toLowerCase()}...`
          }
          initialValue={value[field.key] || ''}
          onChange={onChange}
        />
      </div>
    );
  },

  combobox: ({ field, value, onChange, idPrefix }) => {
    if (!isComboboxFilterField(field)) return null;
    // A11Y: Combobox dùng <button> trigger — không thể dùng htmlFor.
    const labelId = `${idPrefix}label-${field.key}`;
    return (
      <div className="filter-field">
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
  },

  date: ({ field, value, onChange, idPrefix }) => (
    <div className="filter-field">
      <FilterDateInput
        id={`${idPrefix}${field.key}`}
        label={field.label}
        value={(value[field.key] as string) ?? ''}
        onChange={(val) => onChange(field.key, val)}
      />
    </div>
  ),

  date_range: ({ field, value, onChange, idPrefix }) => {
    if (!isDateRangeFilterField(field)) return null;
    return (
      <div className="filter-field flex-[1_1_280px]">
        <label>{field.label}</label>
        <div className="flex items-end gap-2">
          <FilterDateInput
            id={`${idPrefix}${field.keyFrom}`}
            label={field.labelFrom ?? 'Từ ngày'}
            value={(value[field.keyFrom] as string) ?? ''}
            onChange={(val) => onChange(field.keyFrom, val)}
          />
          <span className="text-muted mb-[10px] flex-shrink-0">→</span>
          <FilterDateInput
            id={`${idPrefix}${field.keyTo}`}
            label={field.labelTo ?? 'Đến ngày'}
            value={(value[field.keyTo] as string) ?? ''}
            onChange={(val) => onChange(field.keyTo, val)}
          />
        </div>
      </div>
    );
  },
};
