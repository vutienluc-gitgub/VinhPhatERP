import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import { Icon } from './Icon';
import { EmptyState } from './EmptyState';
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
}

/**
 * A standardized responsive table component for the ERP Premium UI.
 * Handles Desktop (Table) and Mobile (Card List) views automatically.
 */
export function DataTablePremium<T>({
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
}: DataTablePremiumProps<T>) {
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
        <table className="data-table">
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
                    if (col.sortable && col.id && onSort) {
                      onSort(col.id);
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
                        {sortColumn === col.id ? (
                          sortDirection === 'asc' ? (
                            <Icon
                              name="arrow-up"
                              className="w-4 h-4 text-foreground"
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Icon
                              name="arrow-down"
                              className="w-4 h-4 text-foreground"
                              strokeWidth={1.5}
                            />
                          )
                        ) : (
                          <Icon
                            name="chevrons-up-down"
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
            {data.map((item) => (
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
        {data.map((item) => (
          <div
            key={rowKey(item)}
            className="mobile-card-wrapper"
            onClick={() => onRowClick?.(item)}
          >
            {renderMobileCard(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
