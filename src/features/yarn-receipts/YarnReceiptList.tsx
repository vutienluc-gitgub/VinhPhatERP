import { useState } from 'react';

import { Combobox } from '@/shared/components/Combobox';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Icon, Badge, type BadgeVariant } from '@/shared/components';
import { Pagination } from '@/shared/components/Pagination';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatCurrency } from '@/shared/utils/format';

import type { DocStatus, YarnReceipt, YarnReceiptsFilter } from './types';
import {
  useDeleteYarnReceipt,
  useYarnReceiptList,
  useConfirmYarnReceipt,
} from './useYarnReceipts';
import { DOC_STATUS_LABELS } from './yarn-receipts.module';

type YarnReceiptListProps = {
  onEdit: (receipt: YarnReceipt) => void;
  onNew: () => void;
};

function getStatusVariant(status: DocStatus): BadgeVariant {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'warning';
  }
}

export function YarnReceiptList({ onEdit, onNew }: YarnReceiptListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<YarnReceiptsFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = useYarnReceiptList(filters, page);
  const receipts = result?.data ?? [];
  const deleteMutation = useDeleteYarnReceipt();
  const confirmMutation = useConfirmYarnReceipt();
  const { confirm } = useConfirm();
  const { profile } = useAuth();

  const canConfirm = profile?.role === 'admin' || profile?.role === 'manager';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  async function handleDelete(receipt: YarnReceipt) {
    const ok = await confirm({
      message: `Xóa phiếu nhập "${receipt.receipt_number}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(receipt.id);
  }

  async function handleConfirmReceipt(receipt: YarnReceipt) {
    const ok = await confirm({
      message: `Xác nhận phiếu nhập "${receipt.receipt_number}"? Sau khi xác nhận sẽ không thể sửa hay xoá phiếu được nữa.`,
    });
    if (!ok) return;
    try {
      await confirmMutation.mutateAsync(receipt.id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi xác nhận phiếu';
      alert(msg);
    }
  }

  const hasFilter = !!(filters.search || filters.status);

  return (
    <div className="panel-card card-flush">
      {/* Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">NGHIỆP VỤ KHO</p>
          <h3 className="title-premium">Quản lý phiếu nhập sợi</h3>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="btn-primary min-h-[42px] px-5"
            type="button"
            onClick={onNew}
          >
            + Tạo phiếu nhập
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <form
          className="filter-field"
          onSubmit={handleSearch}
          style={{ flex: '1 1 220px' }}
        >
          <label htmlFor="filter-search">Tìm kiếm</label>
          <div className="flex-controls">
            <input
              id="filter-search"
              className="field-input"
              type="text"
              placeholder="Số phiếu nhập..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              className="btn-secondary"
              type="submit"
              style={{ whiteSpace: 'nowrap' }}
            >
              Tìm
            </button>
          </div>
        </form>

        <div className="filter-field">
          <label htmlFor="filter-status">Trạng thái</label>
          <Combobox
            options={[
              {
                value: '',
                label: 'Tất cả',
              },
              {
                value: 'draft',
                label: 'Nháp',
              },
              {
                value: 'confirmed',
                label: 'Đã xác nhận',
              },
              {
                value: 'cancelled',
                label: 'Đã huỷ',
              },
            ]}
            value={filters.status ?? ''}
            onChange={(val) => {
              setPage(1);
              setFilters((prev) => ({
                ...prev,
                status: (val as DocStatus) || undefined,
              }));
            }}
          />
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setSearchInput('');
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Table & Cards */}
      <div className="card-table-section">
        {isLoading ? (
          <div className="flex-center py-12">
            <div className="spinner" />
            <p className="mt-4 text-muted">Đang tải dữ liệu...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="Package" size={48} />
            </div>
            <p>
              {hasFilter
                ? 'Không tìm thấy phiếu nhập phù hợp.'
                : 'Chưa có phiếu nhập nào. Nhấn "+ Tạo phiếu nhập" để bắt đầu.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Số phiếu</th>
                    <th>Nhà cung cấp</th>
                    <th>Ngày nhập</th>
                    <th className="text-right">Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th className="text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td>
                        <span className="font-bold text-primary">
                          {receipt.receipt_number}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {receipt.suppliers?.name ?? '—'}
                          </span>
                          <span className="text-xs text-muted">
                            {receipt.suppliers?.code}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted">{receipt.receipt_date}</td>
                      <td className="numeric-cell font-medium">
                        {formatCurrency(receipt.total_amount ?? 0)}
                      </td>
                      <td>
                        <Badge variant={getStatusVariant(receipt.status)}>
                          {DOC_STATUS_LABELS[receipt.status]}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {receipt.status === 'draft' && canConfirm && (
                            <button
                              className="btn-icon text-success hover:bg-success/10"
                              onClick={() => handleConfirmReceipt(receipt)}
                              disabled={confirmMutation.isPending}
                              title="Xác nhận"
                            >
                              <Icon name="CheckCircle" size={18} />
                            </button>
                          )}
                          {receipt.status === 'draft' && (
                            <button
                              className="btn-icon hover:bg-primary/10"
                              onClick={() => onEdit(receipt)}
                              title="Sửa"
                            >
                              <Icon name="Pencil" size={18} />
                            </button>
                          )}
                          {receipt.status === 'draft' && (
                            <button
                              className="btn-icon text-danger hover:bg-danger/10"
                              onClick={() => handleDelete(receipt)}
                              disabled={deleteMutation.isPending}
                              title="Xóa"
                            >
                              <Icon name="Trash2" size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 px-4 py-2">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="mobile-card"
                  onClick={() => onEdit(receipt)}
                >
                  <div className="mobile-card-header">
                    <span className="mobile-card-title">
                      {receipt.receipt_number}
                    </span>
                    <Badge variant={getStatusVariant(receipt.status)}>
                      {DOC_STATUS_LABELS[receipt.status]}
                    </Badge>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-card-row">
                      <span className="label">NCC:</span>
                      <span className="value">{receipt.suppliers?.name}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="label">Ngày:</span>
                      <span className="value">{receipt.receipt_date}</span>
                    </div>
                    <div className="mobile-card-row pt-2 border-t border-divider mt-2">
                      <span className="label font-bold">Tổng tiền:</span>
                      <span className="value font-bold text-primary">
                        {formatCurrency(receipt.total_amount ?? 0)}
                      </span>
                    </div>
                  </div>
                  {receipt.status === 'draft' && (
                    <div className="mobile-card-actions mt-3 flex gap-2">
                      {canConfirm && (
                        <button
                          className="flex-1 btn-secondary text-success py-2 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmReceipt(receipt);
                          }}
                        >
                          Xác nhận
                        </button>
                      )}
                      <button
                        className="flex-1 btn-secondary text-danger py-2 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(receipt);
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 px-4 pb-4">
        <Pagination result={result} onPageChange={setPage} />
      </div>
    </div>
  );
}
