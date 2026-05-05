/**
 * FilterBar Types - Centralized type definitions
 */

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

export interface FilterBarProps {
  /** Mảng cấu hình các trường lọc */
  schema: FilterFieldConfig[];
  /** Giá trị của các trường lọc (state) */
  value: Record<string, string | undefined>;
  /** Hàm callback khi có trường bộ lọc thay đổi */
  onChange: (key: string, val: string | undefined) => void;
  /** Hàm callback khi bấm "Xóa bộ lọc". Nếu có biến onClear, nút xoá mới hiện. */
  onClear?: () => void;
  /** Layout variant - 'card' (default) có border và padding, 'inline' không có container styling */
  variant?: 'card' | 'inline';
}

/** Props cho field renderer */
export type FieldRendererProps = {
  field: FilterFieldConfig;
  value: Record<string, string | undefined>;
  onChange: (key: string, val: string | undefined) => void;
};

/** Registry type cho field renderers */
export type FieldRenderersRegistry = Record<
  FilterFieldType,
  React.FC<FieldRendererProps>
>;
