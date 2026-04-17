import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import { Icon, DataTablePremium, ClearFilterButton } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { useDeletePayment, usePaymentList } from '@/application/payments';

import { PAYMENT_METHOD_LABELS } from './payments.module';
import type { PaymentsFilter } from './types';

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
          <p className="eyebrow-premium">TÀI CHÍNH</p>
          <h3 className="title-premium">Phiếu Thu</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="card-filter-section p-4 border-b border-border">
        <div className="filter-grid-premium">
          <div className="filter-field">
            <label htmlFor="filter-search">Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                id="filter-search"
                className="field-input"
                type="text"
                placeholder="Số phiếu thu..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="hidden" />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>
        </div>
        {hasFilter && (
          <ClearFilterButton
            onClick={() => {
              setFilters({});
              setSearchInput('');
            }}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            Lỗi tải dữ liệu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={payments}
        isLoading={isLoading}
        rowKey={(p) => p.id}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy phiếu thu' : 'Chưa có phiếu thu nào'
        }
        emptyStateDescription={
          hasFilter
            ? 'Thử điều chỉnh bộ lọc.'
            : 'Phiếu thu được tạo tự động khi xác nhận thanh toán đơn hàng.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Wallet'}
        columns={[
          {
            header: 'Số phiếu',
            id: 'payment_number',
            sortable: true,
            cell: (p) => (
              <span className="font-bold text-primary">{p.payment_number}</span>
            ),
          },
          {
            header: 'Đơn hàng',
            id: 'orders',
            sortable: true,
            accessor: (p) => p.orders?.order_number,
            cell: (p) => (
              <span className="text-muted">
                {p.orders?.order_number ?? '—'}
              </span>
            ),
          },
          {
            header: 'Khách hàng',
            id: 'customers',
            sortable: true,
            accessor: (p) => p.customers?.name,
            cell: (p) => (
              <span className="font-medium">{p.customers?.name ?? '—'}</span>
            ),
          },
          {
            header: 'Ngày thu',
            id: 'payment_date',
            sortable: true,
            className: 'td-muted',
            cell: (p) => p.payment_date,
          },
          {
            header: 'Số tiền',
            id: 'amount',
            sortable: true,
            className: 'text-right',
            cell: (p) => (
              <span className="font-bold text-success">
                {formatCurrency(p.amount)}đ
              </span>
            ),
          },
          {
            header: 'Hình thức',
            id: 'payment_method',
            sortable: true,
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
                title="Xóa phiếu thu"
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
                {formatCurrency(p.amount)}đ
              </span>
            </div>
            <div className="mobile-card-body space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Khách hàng</span>
                  <span className="font-bold">{p.customers?.name ?? '—'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">Đơn hàng</span>
                  <span className="font-medium">
                    {p.orders?.order_number ?? '—'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Ngày: {p.payment_date}</span>
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
                  <Icon name="Trash2" size={16} /> Xóa phiếu
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {deleteMutation.error && (
        <p className="error-inline-sm">
          Lỗi: {(deleteMutation.error as Error).message}
        </p>
      )}

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
