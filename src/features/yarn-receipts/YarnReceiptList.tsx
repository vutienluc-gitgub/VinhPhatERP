import { useState } from 'react';

import { Combobox } from '@/shared/components/Combobox';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
} from '@/shared/components';
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

        <button
          className="btn-primary"
          type="button"
          onClick={onNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            minHeight: 42,
            padding: '0 1.25rem',
          }}
        >
          <Icon name="Plus" size={18} /> Tạo phiếu nhập
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-compact-premium">
          <div className="filter-field">
            <label htmlFor="filter-search">Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                id="filter-search"
                className="field-input"
                type="text"
                placeholder="Số phiếu nhập..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="hidden" />
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>

          <div className="filter-field">
            <label>Trạng thái</label>
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
              className="btn-secondary text-danger flex items-center gap-2"
              type="button"
              onClick={() => {
                setFilters({});
                setSearchInput('');
              }}
              style={{ marginBottom: 4 }}
            >
              <Icon name="X" size={14} /> Xóa lọc
            </button>
          )}
        </div>
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
        data={receipts}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        onRowClick={(r) => onEdit(r)}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy phiếu nhập' : 'Chưa có phiếu nhập nào'
        }
        emptyStateDescription={
          hasFilter
            ? 'Hãy thử thay đổi điều kiện lọc.'
            : 'Nhấn nút tạo phiếu nhập để bắt đầu.'
        }
        emptyStateIcon={hasFilter ? '🔍' : 'Package'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo phiếu nhập' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Số phiếu',
            cell: (r) => (
              <span className="font-bold text-primary">{r.receipt_number}</span>
            ),
          },
          {
            header: 'Nhà cung cấp',
            cell: (r) => (
              <div className="flex flex-col">
                <span className="font-medium">{r.suppliers?.name ?? '—'}</span>
                <span className="text-xs text-muted">{r.suppliers?.code}</span>
              </div>
            ),
          },
          {
            header: 'Ngày nhập',
            cell: (r) => <span className="text-muted">{r.receipt_date}</span>,
          },
          {
            header: 'Tổng tiền',
            className: 'text-right',
            cell: (r) => (
              <span className="font-medium">
                {formatCurrency(r.total_amount ?? 0)}
              </span>
            ),
          },
          {
            header: 'Trạng thái',
            cell: (r) => (
              <Badge variant={getStatusVariant(r.status)}>
                {DOC_STATUS_LABELS[r.status]}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (r) => (
              <div className="flex justify-end gap-1">
                {r.status === 'draft' && canConfirm && (
                  <button
                    className="btn-icon text-success hover:bg-success/10"
                    onClick={() => handleConfirmReceipt(r)}
                    disabled={confirmMutation.isPending}
                    title="Xác nhận"
                  >
                    <Icon name="CheckCircle" size={18} />
                  </button>
                )}
                {r.status === 'draft' ? (
                  <>
                    <button
                      className="btn-icon hover:bg-primary/10"
                      onClick={() => onEdit(r)}
                      title="Sửa"
                    >
                      <Icon name="Pencil" size={18} />
                    </button>
                    <button
                      className="btn-icon text-danger hover:bg-danger/10"
                      onClick={() => handleDelete(r)}
                      disabled={deleteMutation.isPending}
                      title="Xóa"
                    >
                      <Icon name="Trash2" size={18} />
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-icon"
                    onClick={() => onEdit(r)}
                    title="Xem"
                  >
                    <Icon name="Eye" size={18} />
                  </button>
                )}
              </div>
            ),
          },
        ]}
        renderMobileCard={(r) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <span className="mobile-card-title">{r.receipt_number}</span>
              <Badge variant={getStatusVariant(r.status)}>
                {DOC_STATUS_LABELS[r.status]}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted">Nhà cung cấp</span>
                <span className="font-medium">{r.suppliers?.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-border/10">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Ngày nhập</span>
                  <span className="font-medium text-sm">{r.receipt_date}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">Tổng tiền</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(r.total_amount ?? 0)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                {r.status === 'draft' && canConfirm && (
                  <button
                    className="btn-secondary flex-1 text-success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmReceipt(r);
                    }}
                  >
                    <Icon name="CheckCircle" size={16} /> Xác nhận
                  </button>
                )}
                <button
                  className="btn-secondary flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(r);
                  }}
                >
                  <Icon
                    name={r.status === 'draft' ? 'Pencil' : 'Eye'}
                    size={16}
                  />{' '}
                  {r.status === 'draft' ? 'Sửa' : 'Chi tiết'}
                </button>
                {r.status === 'draft' && (
                  <button
                    className="btn-secondary text-danger px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(r);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      />

      <div className="p-4">
        <Pagination result={result} onPageChange={setPage} />
      </div>
    </div>
  );
}
