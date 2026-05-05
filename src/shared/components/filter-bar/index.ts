/**
 * FilterBar - Barrel Export
 * Config-driven filter bar component
 */

export { FilterBar } from './FilterBar';
export type {
  FilterBarProps,
  FilterFieldConfig,
  FilterFieldType,
  SearchFilterField,
  ComboboxFilterField,
  DateFilterField,
  DateRangeFilterField,
} from './types';

// Re-export hooks for consumers that need them
export { useDebouncedValue, useDebouncedCallback } from './useDebouncedValue';
