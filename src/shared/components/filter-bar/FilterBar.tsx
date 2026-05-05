/**
 * FilterBar: Config-driven UI component
 * Giải quyết chuẩn cấu trúc "Thanh Bộ Lọc" đồng bộ toàn app.
 * Lập trình viên chỉ cần truyền file JSON (schema), hệ thống tự render đúng field type.
 */

import React, { useMemo } from 'react';

import { ClearFilterButton } from '@/shared/components/ClearFilterButton';

import { FieldRenderers } from './fieldRenderers';
import type { FilterBarProps, DateRangeFilterField } from './types';

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
    const baseClasses = 'filter-bar overflow-visible';
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
}: FilterBarProps) {
  const hasActiveFilter = useHasActiveFilter(schema, value);
  const containerClasses = useContainerClasses(variant);

  // A11Y: Generate a unique prefix if not provided to prevent DOM ID clashes
  // when multiple FilterBars are rendered on the same page.
  const autoIdPrefix = React.useId();
  const idPrefix = externalIdPrefix || `filter-${autoIdPrefix}-`;

  return (
    <div className={containerClasses}>
      <div className="filter-compact-premium overflow-visible">
        {schema.map((field) => {
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

        {hasActiveFilter && onClear && <ClearFilterButton onClick={onClear} />}
      </div>
    </div>
  );
}
