import { clsx } from 'clsx';
import { useMemo, useState, memo } from 'react';
import type { ReactNode } from 'react';

import type { PaginatedResult } from '@/shared/types/pagination';

import { Icon } from './Icon';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { TableSkeleton } from './TableSkeleton';

export interface Column<T> {
  header: ReactNode;
  cell: (item: T) => ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Custom click handler for specific cell, stops propagation if provided */
  onCellClick?: (item: T, e: React.MouseEvent) => void;
  /** Unique ID for the column, required if the column is sortable */
  id?: string;
  /** Whether the column can be sorted */
  sortable?: boolean;
  /** Hàm trích xuất dữ liệu nội bộ (Dành riêng cho Local Sort tự động đối với cột nested) */
  accessor?: (item: T) => string | number | null | undefined;
}

/** Server-side pagination configuration (backward-compatible, optional) */
export interface PaginationConfig<T> {
  /** Paginated result from API containing page, totalPages, total */
  result: PaginatedResult<T> | undefined;
  /** Callback when user navigates to a different page */
  onPageChange: (page: number) => void;
  /** Custom label for item count, e.g. "cuộn", "đơn hàng". Default: "mục" */
  itemLabel?: string;
}

interface DataTablePremiumProps<T> {
  data: T[];
  columns: Column<T>[];
  renderMobileCard: (item: T) => ReactNode;
  isLoading?: boolean;
  /** Skeleton config */
  skeletonRows?: number;
  /** Empty state config */
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: string;
  emptyStateActionLabel?: string;
  onEmptyStateAction?: () => void;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Additional container classes */
  className?: string;
  rowKey: (item: T) => string | number;
  /** Sort configuration */
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
  /** Tùy chọn Bật/Tắt tính tự sắp xếp phía Client nếu không cấu hình API Sort (Mặc định: Bật) */
  enableClientSort?: boolean;
  /** Sử dụng giao diện thu gọn, tiết kiệm diện tích */
  compact?: boolean;
  /** Server-side pagination config. When provided, pagination bar is rendered below the table. */
  pagination?: PaginationConfig<T>;
}

/**
 * A standardized responsive table component for the ERP Premium UI.
 * Handles Desktop (Table) and Mobile (Card List) views automatically.
 */
function DataTablePremiumInner<T>({
  data,
  columns,
  renderMobileCard,
  isLoading = false,
  skeletonRows = 8,
  emptyStateTitle = 'Không tìm thấy dữ liệu',
  emptyStateDescription = 'Hãy thử thay đổi điều kiện lọc hoặc tạo mới.',
  emptyStateIcon = '🔍',
  emptyStateActionLabel,
  onEmptyStateAction,
  onRowClick,
  className,
  rowKey,
  sortColumn,
  sortDirection,
  onSort,
  enableClientSort = true,
  compact = false,
  pagination,
}: DataTablePremiumProps<T>) {
  // --- NATIVE AUTO-SORT LOGIC ---
  const [internalSortCol, setInternalSortCol] = useState<string | undefined>();
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc'>('asc');

  // Ưu tiên Props (Controlled) nếu có, nếu không thì dùng State Nội Bộ (Uncontrolled)
  const activeSortCol = sortColumn !== undefined ? sortColumn : internalSortCol;
  const activeSortDir =
    sortDirection !== undefined ? sortDirection : internalSortDir;

  const handleToggleSort = (colId: string) => {
    if (onSort) {
      onSort(colId); // Trả quyền quyết định về Màn hình (API Sort)
    } else {
      // Tự động sắp xếp nội bộ
      if (activeSortCol === colId) {
        setInternalSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setInternalSortCol(colId);
        setInternalSortDir('asc');
      }
    }
  };

  // Tự động phân tích dữ liệu mảng và hoán đổi vị trí theo Active State
  const ProcessedData = useMemo(() => {
    if (!enableClientSort || !activeSortCol || onSort) return data; // Nếu màn hình có `onSort`, ta ưu tiên API Data

    return [...data].sort((a, b) => {
      const colDef = columns.find((c) => c.id === activeSortCol);
      // Lấy giá trị so sánh (Dùng accessor nếu có khai báo, nếu không lấy key obj)
      const aVal = colDef?.accessor
        ? colDef.accessor(a)
        : (a as Record<string, unknown>)[activeSortCol];
      const bVal = colDef?.accessor
        ? colDef.accessor(b)
        : (b as Record<string, unknown>)[activeSortCol];

      if (aVal === bVal) return 0;
      if (aVal == null) return activeSortDir === 'asc' ? 1 : -1;
      if (bVal == null) return activeSortDir === 'asc' ? -1 : 1;
      if (aVal < bVal) return activeSortDir === 'asc' ? -1 : 1;
      return activeSortDir === 'asc' ? 1 : -1;
    });
  }, [data, activeSortCol, activeSortDir, enableClientSort, columns, onSort]);
  // ------------------------------

  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} columns={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className="py-20">
        <EmptyState
          icon={emptyStateIcon}
          title={emptyStateTitle}
          description={emptyStateDescription}
          actionLabel={emptyStateActionLabel}
          actionClick={onEmptyStateAction}
        />
      </div>
    );
  }

  const hasFooter = columns.some((col) => col.footer !== undefined);

  return (
    <div className={clsx('card-table-section', className)}>
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className={clsx('data-table', compact && 'data-table-compact')}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.id || idx}
                  className={clsx(
                    col.className,
                    col.sortable &&
                      'cursor-pointer select-none hover:opacity-80 transition-opacity whitespace-nowrap',
                  )}
                  onClick={() => {
                    if (col.sortable && col.id) {
                      handleToggleSort(col.id);
                    }
                  }}
                >
                  <div
                    className={clsx(
                      'flex items-center',
                      col.sortable && 'gap-1',
                    )}
                  >
                    {col.header}
                    {col.sortable && (
                      <span className="shrink-0 flex items-center justify-center">
                        {activeSortCol === col.id ? (
                          activeSortDir === 'asc' ? (
                            <Icon
                              name="ArrowUp"
                              className="w-4 h-4 text-foreground"
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Icon
                              name="ArrowDown"
                              className="w-4 h-4 text-foreground"
                              strokeWidth={1.5}
                            />
                          )
                        ) : (
                          <Icon
                            name="ChevronsUpDown"
                            className="w-4 h-4 text-muted-foreground/50"
                            strokeWidth={1.5}
                          />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ProcessedData.map((item) => (
              <tr
                key={rowKey(item)}
                className={clsx(
                  onRowClick &&
                    'hover:bg-surface-subtle transition-colors cursor-pointer',
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, idx) => (
                  <td
                    key={idx}
                    className={col.className}
                    onClick={(e) => {
                      if (col.onCellClick) {
                        e.stopPropagation();
                        col.onCellClick(item, e);
                      }
                    }}
                  >
                    {col.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {hasFooter && (
            <tfoot>
              <tr className="bg-surface-subtle font-bold border-t-2 border-border">
                {columns.map((col, idx) => (
                  <td key={idx} className={col.className}>
                    {col.footer}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3 p-3">
        {ProcessedData.map((item) => (
          <div
            key={rowKey(item)}
            className="mobile-card-wrapper"
            onClick={() => onRowClick?.(item)}
          >
            {renderMobileCard(item)}
          </div>
        ))}
      </div>

      {/* Built-in Pagination (only when pagination prop is provided) */}
      {pagination && (
        <Pagination
          result={pagination.result}
          onPageChange={pagination.onPageChange}
          itemLabel={pagination.itemLabel}
        />
      )}
    </div>
  );
}

export const DataTablePremium = memo(
  DataTablePremiumInner,
) as typeof DataTablePremiumInner;
