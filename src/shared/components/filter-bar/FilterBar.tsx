/**
 * FilterBar: Config-driven UI component
 * Giải quyết chuẩn cấu trúc "Thanh Bộ Lọc" đồng bộ toàn app.
 * Lập trình viên chỉ cần truyền file JSON (schema), hệ thống tự render đúng field type.
 */

import React, { useMemo, useState } from 'react';

import { ClearFilterButton } from '@/shared/components/ClearFilterButton';
import { Icon } from '@/shared/components/Icon';

import { FieldRenderers } from './fieldRenderers';
import type { FilterBarProps, DateRangeFilterField } from './types';

export interface FilterBarComponentProps extends FilterBarProps {
  size?: 'default' | 'compact';
}

/**
 * Kiểm tra xem có filter nào đang active không
 */
function useHasActiveFilter(
  schema: FilterBarProps['schema'],
  value: FilterBarProps['value'],
): boolean {
  return useMemo(() => {
    return schema.some((field) => {
      if (field.type === 'date_range') {
        const f = field as DateRangeFilterField;
        return (value[f.keyFrom] ?? '') !== '' || (value[f.keyTo] ?? '') !== '';
      }
      const val = value[field.key];
      return val !== undefined && val !== '' && val !== null;
    });
  }, [schema, value]);
}

/**
 * Tạo className cho container dựa vào variant
 */
function useContainerClasses(variant: FilterBarProps['variant']): string {
  return useMemo(() => {
    const baseClasses =
      'filter-bar overflow-visible sticky top-0 z-20 bg-background';
    if (variant === 'card') {
      return `${baseClasses} card-filter-section p-4 border-b border-border`;
    }
    return baseClasses;
  }, [variant]);
}

/**
 * FilterBar Main Component
 */
export function FilterBar({
  schema,
  value,
  onChange,
  onClear,
  variant = 'card',
  idPrefix: externalIdPrefix,
  size = 'default',
}: FilterBarComponentProps) {
  const hasActiveFilter = useHasActiveFilter(schema, value);
  const containerClasses = useContainerClasses(variant);
  const [isExpanded, setIsExpanded] = useState(false);

  // A11Y: Generate a unique prefix if not provided to prevent DOM ID clashes
  // when multiple FilterBars are rendered on the same page.
  const autoIdPrefix = React.useId();
  const idPrefix = externalIdPrefix || `filter-${autoIdPrefix}-`;

  const sizeClasses =
    size === 'compact'
      ? '[&_.field-input]:min-h-[36px] [&_.field-input]:h-[36px] [&_.table-cell-input]:min-h-[36px] [&_.table-cell-input]:h-[36px]'
      : '';

  const hasSecondaryFields = schema.length > 1;

  return (
    <div className={`${containerClasses} ${sizeClasses}`}>
      <div className="filter-compact-premium overflow-visible items-end">
        {schema.map((field, index) => {
          // Hide secondary fields if not expanded
          if (index > 0 && !isExpanded) return null;

          const Renderer = FieldRenderers[field.type];
          if (!Renderer) return null;
          return (
            <Renderer
              key={field.key}
              field={field}
              value={value}
              onChange={onChange}
              idPrefix={idPrefix}
            />
          );
        })}

        {hasSecondaryFields && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-secondary h-10 flex items-center gap-1 px-3 text-sm font-medium"
          >
            <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
            {isExpanded ? 'Ẩn bộ lọc' : 'Bộ lọc'}
          </button>
        )}

        {hasActiveFilter && onClear && <ClearFilterButton onClick={onClear} />}
      </div>
    </div>
  );
}
