import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableAdvanced } from '@/shared/components';
import type { IconName } from '@/shared/components';

interface InventoryDataGridProps<T> {
  title: string;
  data: T[];
  columns: ColumnDef<T, unknown>[];
  isLoading: boolean;
  rowKey: (row: T) => string | number;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: IconName;
  renderMobileCard?: (row: T) => ReactNode;
}

export function InventoryDataGrid<T>({
  title,
  data,
  columns,
  isLoading,
  rowKey,
  emptyStateTitle = 'Không có dữ liệu tồn kho',
  emptyStateDescription = 'Chưa có dữ liệu cho phần này.',
  emptyStateIcon = 'Layers',
  renderMobileCard,
}: InventoryDataGridProps<T>) {
  return (
    <div className="panel-card card-flush">
      {title && (
        <div className="card-header-area">
          <span className="font-bold text-lg">{title}</span>
        </div>
      )}
      <DataTableAdvanced
        data={data}
        columns={columns}
        isLoading={isLoading}
        rowKey={rowKey}
        emptyStateTitle={emptyStateTitle}
        emptyStateDescription={emptyStateDescription}
        emptyStateIcon={emptyStateIcon}
        renderMobileCard={renderMobileCard}
        exportFileName={`Inventory_${title.replace(/\s+/g, '_')}`}
      />
    </div>
  );
}
