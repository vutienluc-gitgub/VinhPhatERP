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
} from '@tanstack/react-table';
import type { Column } from '@tanstack/react-table';
import { clsx } from 'clsx';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { usePersistedColumnVisibility } from '@/shared/hooks/usePersistedColumnVisibility';
import { TABLE_LABELS } from '@/shared/constants/ui.constants';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './TableSkeleton';
import { Button } from './Button';
import { Pagination } from './Pagination';
import type { PaginationConfig } from './DataTable';
import { PageSizeSelect } from './PageSizeSelect';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHECKBOX_CLASS =
  'w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer';

const CHECKBOX_WRAPPER_CLASS = 'px-1 flex items-center justify-center';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ColumnMeta {
  className?: string;
}

/** Type-safe accessor cho column meta className — tránh `as` cast lặp lại. */
function getColumnMetaClass(meta: unknown): string | undefined {
  if (meta && typeof meta === 'object' && 'className' in meta) {
    return (meta as ColumnMeta).className;
  }
  return undefined;
}

// ─── Types (public) ───────────────────────────────────────────────────────────

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
  /** Khi cung cấp, trạng thái ẩn/hiện cột được lưu vào localStorage và giữ lại sau khi tải lại trang. */
  storageKey?: string;
}

// ─── Sub-component: BulkActionsFloatingBar ────────────────────────────────────

interface BulkActionsBarProps<TData> {
  selectedCount: number;
  bulkActions: BulkActionConfig<TData>[];
  getSelectedRows: () => TData[];
  onClearSelection: () => void;
}

function BulkActionsFloatingBar<TData>({
  selectedCount,
  bulkActions,
  getSelectedRows,
  onClearSelection,
}: BulkActionsBarProps<TData>) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-surface shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] border border-border/80 rounded-full animate-in slide-in-from-bottom-8">
      <div className="flex items-center gap-2 pr-4 border-r border-border">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
          {selectedCount}
        </span>
        <span className="text-sm font-medium whitespace-nowrap">
          {TABLE_LABELS.SELECTED_SUFFIX}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {bulkActions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant || 'outline'}
            leftIcon={action.icon}
            size="sm"
            onClick={() => action.onClick(getSelectedRows())}
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
        onClick={onClearSelection}
        className="w-8 h-8 rounded-full ml-2 hover:bg-surface-subtle text-muted"
        title={TABLE_LABELS.CANCEL_SELECTION}
      >
        <Icon name="X" size={16} />
      </Button>
    </div>
  );
}

// ─── Sub-component: ColumnVisibilityMenu ──────────────────────────────────────

interface ColumnVisibilityMenuProps<TData> {
  columns: Column<TData, unknown>[];
}

function ColumnVisibilityMenu<TData>({
  columns,
}: ColumnVisibilityMenuProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <Button
        variant="outline"
        size="icon"
        leftIcon="Columns3"
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx('w-9 h-9', isOpen && 'bg-surface-subtle')}
        title={TABLE_LABELS.SHOW_COLUMNS}
      />
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface shadow-2xl border border-border/60 rounded-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-subtle rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                <span className="text-sm font-medium text-foreground truncate">
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : column.id}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: SortIcon ──────────────────────────────────────────────────

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') {
    return (
      <Icon
        name="ArrowUp"
        className="w-4 h-4 text-foreground shrink-0"
        strokeWidth={1.5}
      />
    );
  }
  if (direction === 'desc') {
    return (
      <Icon
        name="ArrowDown"
        className="w-4 h-4 text-foreground shrink-0"
        strokeWidth={1.5}
      />
    );
  }
  return (
    <Icon
      name="ChevronsUpDown"
      className="w-4 h-4 text-muted/50 shrink-0"
      strokeWidth={1.5}
    />
  );
}

// ─── Sub-component: InlinePagination ──────────────────────────────────────────

interface InlinePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalItems: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function InlinePagination({
  pageIndex,
  pageSize,
  pageCount,
  totalItems,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
}: InlinePaginationProps) {
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-3 mt-2">
      <div className="text-sm text-muted">
        {TABLE_LABELS.SHOWING} {from} - {to} {TABLE_LABELS.OF_TOTAL}{' '}
        {totalItems} {TABLE_LABELS.RECORDS}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 rounded-lg"
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
          leftIcon="ChevronLeft"
        />
        <span className="text-sm font-medium px-2">
          {pageIndex + 1} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 rounded-lg"
          onClick={onNextPage}
          disabled={!canNextPage}
          leftIcon="ChevronRight"
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function DataTableAdvancedInner<TData>({
  data,
  columns,
  renderMobileCard,
  isLoading = false,
  skeletonRows = 8,
  emptyStateTitle = TABLE_LABELS.NO_DATA_TITLE,
  emptyStateDescription = TABLE_LABELS.NO_DATA_DESC,
  emptyStateIcon = 'Search',
  emptyStateActionLabel,
  onEmptyStateAction,
  className,
  rowKey,
  onRowClick,
  exportFileName = 'export_data',
  pagination,
  bulkActions,
  storageKey,
}: DataTableAdvancedProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    usePersistedColumnVisibility(storageKey);
  const [rowSelection, setRowSelection] = useState({});

  const finalColumns = useMemo(() => {
    if (!bulkActions || bulkActions.length === 0) return columns;
    const selectColumn: ColumnDef<TData, unknown> = {
      id: 'select',
      header: ({ table: tbl }) => (
        <div className={CHECKBOX_WRAPPER_CLASS}>
          <input
            type="checkbox"
            className={CHECKBOX_CLASS}
            checked={tbl.getIsAllPageRowsSelected()}
            ref={(input) => {
              if (input) input.indeterminate = tbl.getIsSomePageRowsSelected();
            }}
            onChange={tbl.getToggleAllPageRowsSelectedHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div
          className={CHECKBOX_WRAPPER_CLASS}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className={CHECKBOX_CLASS}
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
    state: { sorting, columnVisibility, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: rowKey ? (row) => String(rowKey(row)) : undefined,
  });

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      const visibleColumns = table
        .getVisibleLeafColumns()
        .filter((col) => col.id !== 'actions' && col.id !== 'select');

      worksheet.addRow(
        visibleColumns.map((c) =>
          typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id,
        ),
      );

      const hasSelection = table.getSelectedRowModel().rows.length > 0;
      const exportRows = hasSelection
        ? table.getSelectedRowModel().rows
        : table.getCoreRowModel().rows;
      exportRows.forEach((row) => {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ExportExcelError]', message);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} columns={columns.length} />;
  }

  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <div className={clsx('flex flex-col gap-4 min-w-0', className)}>
      {/* Floating Bulk Actions Toolbar */}
      {bulkActions && bulkActions.length > 0 && (
        <BulkActionsFloatingBar
          selectedCount={selectedCount}
          bulkActions={bulkActions}
          getSelectedRows={() =>
            table.getSelectedRowModel().rows.map((r) => r.original)
          }
          onClearSelection={() => table.toggleAllRowsSelected(false)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
        <PageSizeSelect
          value={table.getState().pagination.pageSize}
          onValueChange={(val) => table.setPageSize(val)}
          options={PAGE_SIZE_OPTIONS}
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            leftIcon="FileSpreadsheet"
            onClick={handleExportExcel}
            className="w-9 h-9"
            title={TABLE_LABELS.EXPORT_EXCEL}
          />
          <ColumnVisibilityMenu columns={table.getAllLeafColumns()} />
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
                      const sortDir = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          className={clsx(
                            getColumnMetaClass(header.column.columnDef.meta),
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
                              {header.column.getCanSort() && (
                                <SortIcon direction={sortDir} />
                              )}
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
                      'group',
                      onRowClick &&
                        'hover:bg-surface-subtle transition-colors cursor-pointer',
                      row.getIsSelected() && 'bg-primary/5',
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={getColumnMetaClass(
                          cell.column.columnDef.meta,
                        )}
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
          <InlinePagination
            pageIndex={table.getState().pagination.pageIndex}
            pageSize={table.getState().pagination.pageSize}
            pageCount={table.getPageCount()}
            totalItems={data.length}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            onPreviousPage={() => table.previousPage()}
            onNextPage={() => table.nextPage()}
          />
        )
      )}
    </div>
  );
}

export const DataTableAdvanced = memo(
  DataTableAdvancedInner,
) as typeof DataTableAdvancedInner;
