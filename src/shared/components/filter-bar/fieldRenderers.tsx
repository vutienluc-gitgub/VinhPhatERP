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
import type {
  FieldRenderersRegistry,
  SearchFilterField,
  ComboboxFilterField,
  DateRangeFilterField,
} from './types';

/**
 * Registry của tất cả field renderers.
 * Mỗi field type có một React component tương ứng.
 */
export const FieldRenderers: FieldRenderersRegistry = {
  search: ({ field, value, onChange }) => {
    const searchField = field as SearchFilterField;
    return (
      <div className="filter-field">
        <label htmlFor={`filter-${field.key}`}>{field.label}</label>
        <DebouncedSearchInput
          id={`filter-${field.key}`}
          fieldKey={field.key}
          placeholder={
            searchField.placeholder ||
            `Tìm kiếm ${field.label.toLowerCase()}...`
          }
          initialValue={value[field.key] || ''}
          onChange={onChange}
        />
      </div>
    );
  },

  combobox: ({ field, value, onChange }) => {
    const comboField = field as ComboboxFilterField;
    // A11Y: Combobox dùng <button> trigger — không thể dùng htmlFor.
    const labelId = `filter-label-${field.key}`;
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
            ...comboField.options,
          ]}
          value={(value[field.key] as string) ?? ''}
          onChange={(val) => onChange(field.key, val || undefined)}
        />
      </div>
    );
  },

  date: ({ field, value, onChange }) => (
    <div className="filter-field">
      <FilterDateInput
        id={`filter-${field.key}`}
        label={field.label}
        value={(value[field.key] as string) ?? ''}
        onChange={(val) => onChange(field.key, val)}
      />
    </div>
  ),

  date_range: ({ field, value, onChange }) => {
    const rangeField = field as DateRangeFilterField;
    return (
      <div className="filter-field flex-[1_1_280px]">
        <label>{field.label}</label>
        <div className="flex items-center gap-2">
          <FilterDateInput
            id={`filter-${rangeField.keyFrom}`}
            label={rangeField.labelFrom ?? 'Từ ngày'}
            value={(value[rangeField.keyFrom] as string) ?? ''}
            onChange={(val) => onChange(rangeField.keyFrom, val)}
          />
          <span className="text-muted mt-4 flex-shrink-0">→</span>
          <FilterDateInput
            id={`filter-${rangeField.keyTo}`}
            label={rangeField.labelTo ?? 'Đến ngày'}
            value={(value[rangeField.keyTo] as string) ?? ''}
            onChange={(val) => onChange(rangeField.keyTo, val)}
          />
        </div>
      </div>
    );
  },
};
