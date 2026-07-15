import { useState } from 'react';
import toast from 'react-hot-toast';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTableAdvanced,
  FilterBar,
  type FilterFieldConfig,
  PageLayout,
  PageHeader,
  TableSection,
  Icon,
  KpiCard,
  ErrorInline,
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
      message: MSG.CONFIRM_MSG(
        inv.invoice_number,
        inv.weaving_invoice_rolls?.length ?? 0,
      ),
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await confirmMutation.mutateAsync(inv.id);
      toast.success(MSG.CONFIRM_SUCCESS);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      await confirm({
        title: MSG.ERR_TITLE,
        message: `${MSG.ERR_CONFIRM}${errMessage}`,
        variant: 'danger',
        cancelLabel: MSG.BTN_CLOSE,
        confirmLabel: '',
      });
    }
  }

  async function handleDelete(inv: WeavingInvoice) {
    const ok = await confirm({
      message: MSG.DELETE_MSG(inv.invoice_number),
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteMutation.mutateAsync(inv.id);
      toast.success(MSG.DELETE_SUCCESS);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      await confirm({
        title: MSG.ERR_TITLE,
        message: `${MSG.ERR_DELETE}${errMessage}`,
        variant: 'danger',
        cancelLabel: MSG.BTN_CLOSE,
        confirmLabel: '',
      });
    }
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
        { value: 'draft', label: MSG.STATUS_DRAFT },
        { value: 'confirmed', label: MSG.STATUS_CONFIRMED },
        { value: 'paid', label: MSG.STATUS_PAID },
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6 lg:px-8 mt-4">
        <KpiCard
          label={MSG.KPI_TOTAL_TITLE}
          value={result?.total ?? 0}
          icon="Package"
          variant="primary"
          formatMode="number"
        />
        <KpiCard
          label={MSG.KPI_DRAFT_TITLE}
          value={invoices.filter((inv) => inv.status === 'draft').length}
          icon="Clock"
          variant="warning"
          formatMode="number"
        />
      </div>

      <TableSection>
        {error && (
          <div className="p-4">
            <ErrorInline>
              {MSG.ERR_LOAD}{' '}
              {error instanceof Error ? error.message : String(error)}
            </ErrorInline>
          </div>
        )}
        {confirmMutation.error && (
          <div className="p-4">
            <ErrorInline>
              {confirmMutation.error instanceof Error
                ? confirmMutation.error.message
                : String(confirmMutation.error)}
            </ErrorInline>
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
