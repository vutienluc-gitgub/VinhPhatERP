import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTableAdvanced,
  FilterBar,
  type FilterFieldConfig,
  PageHeader,
  TableSection,
} from '@/shared/components';
import { useDeletePayment, usePaymentList } from '@/application/payments';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import type { PaymentsFilter } from '@/domain/payments/types';

import { usePaymentColumns } from './hooks/usePaymentColumns';
import { PaymentMobileCard } from './components/PaymentMobileCard';
import { PAYMENT_LIST_MESSAGES as MSG } from './payments.constants';

export function PaymentList() {
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'search',
    'fromDate',
    'toDate',
  ]);
  const [page, setPage] = useState(1);

  const {
    data: result,
    isLoading,
    error,
  } = usePaymentList(filters as PaymentsFilter, page);
  const payments = result?.data ?? [];
  const deleteMutation = useDeletePayment();
  const { confirm } = useConfirm();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: MSG.FILTER_SEARCH_LABEL,
      placeholder: MSG.FILTER_SEARCH_PLACEHOLDER,
    },
    {
      key: 'payment_date', // Used merely for identification, date_range fields use keyFrom/keyTo
      type: 'date_range',
      label: MSG.FILTER_DATE,
      keyFrom: 'fromDate',
      keyTo: 'toDate',
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      message: MSG.DELETE_CONFIRM,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  }

  const hasFilter = !!(filters.search || filters.fromDate || filters.toDate);

  const columns = usePaymentColumns({
    handleDelete,
    isDeleting: deleteMutation.isPending,
  });

  return (
    <>
      <PageHeader title={MSG.TITLE} subtitle={MSG.SUBTITLE} />

      <FilterBar
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          clearFilters();
          setPage(1);
        }}
      />

      {error && (
        <div className="p-4">
          <p className="error-inline">
            {MSG.ERROR_LOAD}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {deleteMutation.error && (
        <div className="p-4 pt-0">
          <p className="error-inline-sm">
            {MSG.ERROR_DELETE}
            {deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : String(deleteMutation.error)}
          </p>
        </div>
      )}

      <TableSection>
        <DataTableAdvanced
          data={payments}
          isLoading={isLoading}
          rowKey={(p) => p.id}
          emptyStateTitle={hasFilter ? MSG.EMPTY_TITLE_FILTER : MSG.EMPTY_TITLE}
          emptyStateDescription={
            hasFilter ? MSG.EMPTY_DESC_FILTER : MSG.EMPTY_DESC
          }
          emptyStateIcon={hasFilter ? 'Search' : 'Wallet'}
          columns={columns}
          renderMobileCard={(p) => (
            <PaymentMobileCard
              payment={p}
              handleDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          )}
          pagination={{
            result,
            onPageChange: setPage,
            itemLabel: MSG.PAGINATION_LABEL,
          }}
        />
      </TableSection>
    </>
  );
}
