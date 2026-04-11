import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import { Icon, DataTablePremium } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

import { PAYMENT_METHOD_LABELS } from './payments.module';
import type { PaymentsFilter } from './types';
import { useDeletePayment, usePaymentList } from './usePayments';

export function PaymentList() {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<PaymentsFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = usePaymentList(filters, page);
  const payments = result?.data ?? [];
  const deleteMutation = useDeletePayment();
  const { confirm } = useConfirm();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      message: 'Xoá phiếu thu này? Số tiền sẽ bị trừ khỏi đơn hàng.',
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  }

  const hasFilter = !!filters.search;

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">T\u00c0I CH\u00cdNH</p>
          <h3 className="title-premium">Phi\u1ebfu Thu</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="card-filter-section p-4 border-b border-border">
        <div className="filter-grid-premium">
          <div className="filter-field">
            <label htmlFor="filter-search">T\u00ecm ki\u1ebfm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                id="filter-search"
                className="field-input"
                type="text"
                placeholder="S\u1ed1 phi\u1ebfu thu..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="hidden" />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>
        </div>
        {hasFilter && (
          <button
            className="btn-secondary text-danger border-danger/20 flex items-center gap-2"
            type="button"
            onClick={() => {
              setFilters({});
              setSearchInput('');
            }}
            style={{ marginTop: '1rem' }}
          >
            <Icon name="X" size={14} /> X\u00f3a l\u1ecdc
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            L\u1ed7i t\u1ea3i d\u1eef li\u1ec7u: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={payments}
        isLoading={isLoading}
        rowKey={(p) => p.id}
        emptyStateTitle={
          hasFilter
            ? 'Kh\u00f4ng t\u00ecm th\u1ea5y phi\u1ebfu thu'
            : 'Ch\u01b0a c\u00f3 phi\u1ebfu thu n\u00e0o'
        }
        emptyStateDescription={
          hasFilter
            ? 'Th\u1eed \u0111i\u1ec1u ch\u1ec9nh b\u1ed9 l\u1ecdc.'
            : 'Phi\u1ebfu thu \u0111\u01b0\u1ee3c t\u1ea1o t\u1ef1 \u0111\u1ed9ng khi x\u00e1c nh\u1eadn thanh to\u00e1n \u0111\u01a1n h\u00e0ng.'
        }
        emptyStateIcon={hasFilter ? '\ud83d\udd0d' : 'Wallet'}
        columns={[
          {
            header: 'S\u1ed1 phi\u1ebfu',
            cell: (p) => (
              <span className="font-bold text-primary">{p.payment_number}</span>
            ),
          },
          {
            header: '\u0110\u01a1n h\u00e0ng',
            cell: (p) => (
              <span className="text-muted">
                {p.orders?.order_number ?? '\u2014'}
              </span>
            ),
          },
          {
            header: 'Kh\u00e1ch h\u00e0ng',
            cell: (p) => (
              <span className="font-medium">
                {p.customers?.name ?? '\u2014'}
              </span>
            ),
          },
          {
            header: 'Ng\u00e0y thu',
            className: 'td-muted',
            cell: (p) => p.payment_date,
          },
          {
            header: 'S\u1ed1 ti\u1ec1n',
            className: 'text-right',
            cell: (p) => (
              <span className="font-bold text-success">
                {formatCurrency(p.amount)}\u0111
              </span>
            ),
          },
          {
            header: 'H\u00ecnh th\u1ee9c',
            className: 'td-muted',
            cell: (p) => PAYMENT_METHOD_LABELS[p.payment_method],
          },
          {
            header: '',
            onCellClick: () => {},
            cell: (p) => (
              <button
                className="btn-icon text-danger hover:bg-danger/10"
                type="button"
                onClick={() => handleDelete(p.id)}
                disabled={deleteMutation.isPending}
                title="X\u00f3a phi\u1ebfu thu"
              >
                <Icon name="Trash2" size={16} />
              </button>
            ),
          },
        ]}
        renderMobileCard={(p) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{p.payment_number}</span>
              <span className="font-bold text-success text-lg">
                {formatCurrency(p.amount)}\u0111
              </span>
            </div>
            <div className="mobile-card-body space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">
                    Kh\u00e1ch h\u00e0ng
                  </span>
                  <span className="font-bold">
                    {p.customers?.name ?? '\u2014'}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">
                    \u0110\u01a1n h\u00e0ng
                  </span>
                  <span className="font-medium">
                    {p.orders?.order_number ?? '\u2014'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Ng\u00e0y: {p.payment_date}</span>
                <span>{PAYMENT_METHOD_LABELS[p.payment_method]}</span>
              </div>
              <div className="pt-2 border-t border-border/10">
                <button
                  className="btn-secondary w-full text-danger border-danger/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Icon name="Trash2" size={16} /> X\u00f3a phi\u1ebfu
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {deleteMutation.error && (
        <p className="error-inline-sm">
          L\u1ed7i: {(deleteMutation.error as Error).message}
        </p>
      )}

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
