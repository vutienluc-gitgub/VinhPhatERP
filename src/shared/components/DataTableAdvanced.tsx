import { useState, useRef, useEffect, memo, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { clsx } from 'clsx';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './TableSkeleton';
import { Button } from './Button';
import { Pagination } from './Pagination';
import type { PaginationConfig } from './DataTable';

export interface BulkActionConfig<TData> {
  label: string;
  icon: IconName;
  onClick: (selectedRows: TData[]) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
}

export interface DataTableAdvancedProps<TData> {
  data: TData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  renderMobileCard?: (item: TData) => ReactNode;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: IconName | string;
  emptyStateActionLabel?: string;
  onEmptyStateAction?: () => void;
  className?: string;
  rowKey?: (item: TData) => string | number;
  onRowClick?: (item: TData) => void;
  exportFileName?: string;
  pagination?: PaginationConfig<TData>;
  bulkActions?: BulkActionConfig<TData>[];
}

function DataTableAdvancedInner<TData>({
  data,
  columns,
  renderMobileCard,
  isLoading = false,
  skeletonRows = 8,
  emptyStateTitle = 'Không tìm thấy dữ liệu',
  emptyStateDescription = 'Không có dữ liệu phù hợp với điều kiện.',
  emptyStateIcon = 'Search',
  emptyStateActionLabel,
  onEmptyStateAction,
  className,
  rowKey,
  onRowClick,
  exportFileName = 'export_data',
  pagination,
  bulkActions,
}: DataTableAdvancedProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const finalColumns = useMemo(() => {
    if (!bulkActions || bulkActions.length === 0) return columns;
    const selectColumn: ColumnDef<TData, unknown> = {
      id: 'select',
      header: ({ table }) => (
        <div className="px-1 flex items-center justify-center">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            checked={table.getIsAllPageRowsSelected()}
            ref={(input) => {
              if (input)
                input.indeterminate = table.getIsSomePageRowsSelected();
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div
          className="px-1 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        </div>
      ),
      meta: { className: 'w-10 text-center' },
      enableSorting: false,
    };
    return [selectColumn, ...columns];
  }, [columns, bulkActions]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: rowKey ? (row) => String(rowKey(row)) : undefined,
  });

  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        colMenuRef.current &&
        !colMenuRef.current.contains(event.target as Node)
      ) {
        setColMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Get visible columns for export
    const visibleColumns = table
      .getVisibleLeafColumns()
      .filter((col) => col.id !== 'actions' && col.id !== 'select');

    // Add header
    worksheet.addRow(
      visibleColumns.map((c) =>
        typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id,
      ),
    );

    // Add rows (only selected if any, else all)
    const hasSelection = table.getSelectedRowModel().rows.length > 0;
    const rows = hasSelection
      ? table.getSelectedRowModel().rows
      : table.getCoreRowModel().rows;
    rows.forEach((row) => {
      const rowData = visibleColumns.map((col) => {
        const val = row.getValue(col.id);
        return val != null ? String(val) : '';
      });
      worksheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `${exportFileName}_${new Date().getTime()}.xlsx`,
    );
  };

  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} columns={columns.length} />;
  }

  return (
    <div className={clsx('flex flex-col gap-4', className)}>
      {/* Floating Bulk Actions Toolbar */}
      {table.getSelectedRowModel().rows.length > 0 &&
        bulkActions &&
        bulkActions.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-surface shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] border border-border/80 rounded-full animate-in slide-in-from-bottom-8">
            <div className="flex items-center gap-2 pr-4 border-r border-border">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {table.getSelectedRowModel().rows.length}
              </span>
              <span className="text-sm font-medium whitespace-nowrap">
                đã chọn
              </span>
            </div>

            <div className="flex items-center gap-2">
              {bulkActions.map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant || 'outline'}
                  leftIcon={action.icon}
                  size="sm"
                  onClick={() =>
                    action.onClick(
                      table.getSelectedRowModel().rows.map((r) => r.original),
                    )
                  }
                  className={clsx(
                    'whitespace-nowrap',
                    action.variant === 'danger' &&
                      'text-danger border-danger/20 hover:bg-danger/10',
                  )}
                >
                  {action.label}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.toggleAllRowsSelected(false)}
              className="w-8 h-8 rounded-full ml-2 hover:bg-surface-subtle text-muted"
              title="Hủy chọn"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Hiển thị:</span>
          <select
            className="h-9 px-3 py-1 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize} dòng
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            leftIcon="FileDown"
            onClick={handleExportExcel}
            className="w-9 h-9"
            title="Xuất Excel"
          />

          <div className="relative inline-flex" ref={colMenuRef}>
            <Button
              variant="outline"
              size="icon"
              leftIcon="Columns3"
              onClick={() => setColMenuOpen(!colMenuOpen)}
              className={clsx('w-9 h-9', colMenuOpen && 'bg-surface-subtle')}
              title="Hiển thị cột"
            />
            {colMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface shadow-2xl border border-border/60 rounded-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                  {table.getAllLeafColumns().map((column) => {
                    return (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-subtle rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary"
                          {...{
                            checked: column.getIsVisible(),
                            onChange: column.getToggleVisibilityHandler(),
                          }}
                        />
                        <span className="text-sm font-medium text-foreground truncate">
                          {typeof column.columnDef.header === 'string'
                            ? column.columnDef.header
                            : column.id}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      {data.length === 0 ? (
        <div className="py-20 border border-border rounded-xl">
          <EmptyState
            icon={emptyStateIcon}
            title={emptyStateTitle}
            description={emptyStateDescription}
            actionLabel={emptyStateActionLabel}
            actionClick={onEmptyStateAction}
          />
        </div>
      ) : (
        <div className="card-table-section rounded-xl border border-border overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          className={clsx(
                            (
                              header.column.columnDef.meta as {
                                className?: string;
                              }
                            )?.className,
                            header.column.getCanSort() &&
                              'cursor-pointer select-none hover:bg-surface-subtle transition-colors',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={clsx(
                                'flex items-center gap-1',
                                header.column.getCanSort() && 'select-none',
                              )}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {{
                                asc: (
                                  <Icon
                                    name="ArrowUp"
                                    className="w-4 h-4 text-foreground shrink-0"
                                    strokeWidth={1.5}
                                  />
                                ),
                                desc: (
                                  <Icon
                                    name="ArrowDown"
                                    className="w-4 h-4 text-foreground shrink-0"
                                    strokeWidth={1.5}
                                  />
                                ),
                              }[header.column.getIsSorted() as string] ??
                                (header.column.getCanSort() ? (
                                  <Icon
                                    name="ChevronsUpDown"
                                    className="w-4 h-4 text-muted/50 shrink-0"
                                    strokeWidth={1.5}
                                  />
                                ) : null)}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={clsx(
                      onRowClick &&
                        'hover:bg-surface-subtle transition-colors cursor-pointer',
                      row.getIsSelected() && 'bg-primary/5',
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={
                          (cell.column.columnDef.meta as { className?: string })
                            ?.className
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          {renderMobileCard && (
            <div className="md:hidden flex flex-col divide-y divide-border/50">
              {table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className="p-3"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {renderMobileCard(row.original)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination Footer */}
      {pagination ? (
        <Pagination
          result={pagination.result}
          onPageChange={pagination.onPageChange}
          itemLabel={pagination.itemLabel}
        />
      ) : (
        data.length > 0 &&
        table.getPageCount() > 1 && (
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="text-sm text-muted">
              Hiển thị{' '}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{' '}
              -{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                data.length,
              )}{' '}
              trong tổng số {data.length} bản ghi
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-lg"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                leftIcon="ChevronLeft"
              />
              <span className="text-sm font-medium px-2">
                {table.getState().pagination.pageIndex + 1} /{' '}
                {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-lg"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                leftIcon="ChevronRight"
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}

export const DataTableAdvanced = memo(
  DataTableAdvancedInner,
) as typeof DataTableAdvancedInner;
