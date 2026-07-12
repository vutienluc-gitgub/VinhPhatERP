import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTableAdvanced,
  FilterBar,
  type FilterFieldConfig,
  PageLayout,
  PageHeader,
  TableSection,
  Icon,
} from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import {
  useWeavingInvoiceList,
  useConfirmWeavingInvoice,
  useDeleteWeavingInvoice,
} from '@/application/production';

import type { WeavingInvoice, WeavingInvoiceFilter } from './types';
import { WEAVING_INVOICE_MESSAGES as MSG } from './weaving-invoices.constants';
import { WeavingInvoiceMobileCard } from './components/WeavingInvoiceMobileCard';
import { useWeavingInvoiceColumns } from './hooks/useWeavingInvoiceColumns';

type Props = {
  onNew: () => void;
  onEdit: (invoice: WeavingInvoice) => void;
};

export function WeavingInvoiceList({ onNew, onEdit }: Props) {
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'search',
    'status',
  ]);
  const [page, setPage] = useState(1);

  const {
    data: result,
    isLoading,
    error,
  } = useWeavingInvoiceList(filters as WeavingInvoiceFilter, page);
  const invoices = result?.data ?? [];

  const confirmMutation = useConfirmWeavingInvoice();
  const deleteMutation = useDeleteWeavingInvoice();
  const { confirm } = useConfirm();

  async function handleConfirm(inv: WeavingInvoice) {
    const ok = await confirm({
      message: `Xác nhận phiếu "${inv.invoice_number}"? Hệ thống sẽ tự động nhập ${inv.weaving_invoice_rolls?.length ?? '?'} cuộn vào kho vải mộc.`,
      variant: 'danger',
    });
    if (!ok) return;
    confirmMutation.mutate(inv.id);
  }

  async function handleDelete(inv: WeavingInvoice) {
    const ok = await confirm({
      message: `Xóa phiếu nháp "${inv.invoice_number}"?`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(inv.id);
  }

  const hasFilter = !!(filters.search || filters.status);

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: MSG.FILTER_SEARCH_LABEL,
      placeholder: MSG.FILTER_SEARCH_PLACEHOLDER,
    },
    {
      key: 'status',
      type: 'combobox',
      label: MSG.FILTER_STATUS_LABEL,
      options: [
        { value: 'draft', label: 'Nháp' },
        { value: 'confirmed', label: 'Đã xác nhận' },
        { value: 'paid', label: 'Đã thanh toán' },
      ],
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  const columns = useWeavingInvoiceColumns({
    onEdit,
    onConfirm: handleConfirm,
    onDelete: handleDelete,
    isConfirming: confirmMutation.isPending,
    isDeleting: deleteMutation.isPending,
  });

  return (
    <PageLayout>
      <PageHeader
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={onNew}
          >
            <Icon name="Plus" size={18} />
            {MSG.BTN_CREATE}
          </button>
        }
      />

      <div className="stats-grid-premium px-4 sm:px-6 lg:px-8 mt-4">
        <div className="stat-item-premium">
          <div className="stat-icon-wrapper bg-[rgba(11,107,203,0.1)] text-[var(--primary)]">
            <Icon name="Package" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>{MSG.KPI_TOTAL_TITLE}</p>
            <p>{result?.total ?? 0}</p>
          </div>
        </div>

        <div className="stat-item-premium">
          <div className="stat-icon-wrapper bg-[rgba(234,179,8,0.1)] text-warning">
            <Icon name="Clock" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>{MSG.KPI_DRAFT_TITLE}</p>
            <p>{invoices.filter((inv) => inv.status === 'draft').length}</p>
          </div>
        </div>
      </div>

      <TableSection>
        {error && (
          <div className="p-4">
            <p className="error-inline">
              {MSG.ERR_LOAD}{' '}
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        )}
        {confirmMutation.error && (
          <div className="p-4">
            <p className="error-inline">
              {confirmMutation.error instanceof Error
                ? confirmMutation.error.message
                : String(confirmMutation.error)}
            </p>
          </div>
        )}

        <div className="w-full px-4 sm:px-6 lg:px-8 mt-2 pb-4 border-b border-border flex flex-col gap-4">
          <FilterBar
            schema={filterSchema}
            value={filters}
            onChange={handleFilterChange}
            onClear={hasFilter ? clearFilters : undefined}
          />
        </div>

        <DataTableAdvanced
          data={invoices}
          columns={columns}
          isLoading={isLoading}
          rowKey={(inv) => inv.id}
          emptyStateTitle={
            hasFilter ? MSG.EMPTY_STATE_FILTER_TITLE : MSG.EMPTY_STATE_TITLE
          }
          emptyStateDescription={
            hasFilter ? MSG.EMPTY_STATE_FILTER_DESC : MSG.EMPTY_STATE_DESC
          }
          emptyStateIcon={hasFilter ? 'Search' : 'Package'}
          emptyStateActionLabel={!hasFilter ? MSG.BTN_CREATE : undefined}
          onEmptyStateAction={!hasFilter ? onNew : undefined}
          renderMobileCard={(inv) => (
            <WeavingInvoiceMobileCard
              invoice={inv}
              onEdit={onEdit}
              onConfirm={handleConfirm}
              onDelete={handleDelete}
              isConfirming={confirmMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          )}
          pagination={{
            result,
            onPageChange: setPage,
          }}
        />
      </TableSection>
    </PageLayout>
  );
}
