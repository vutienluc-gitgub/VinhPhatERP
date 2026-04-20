import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  Button,
  ActionBar,
  FilterBarPremium,
  KpiCardPremium,
  KpiGridPremium,
  type FilterFieldConfig,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { Pagination } from '@/shared/components/Pagination';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatCurrency } from '@/shared/utils/format';
import {
  useDeleteYarnReceipt,
  useYarnReceiptList,
  useConfirmYarnReceipt,
} from '@/application/inventory';

import type { DocStatus, YarnReceipt, YarnReceiptsFilter } from './types';
import { DOC_STATUS_LABELS } from './yarn-receipts.module';

type YarnReceiptListProps = {
  onEdit: (receipt: YarnReceipt) => void;
  onNew: () => void;
  totalWeight: number;
  pendingCount: number;
  supplierCount: number;
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

export function YarnReceiptList({
  onEdit,
  onNew,
  totalWeight,
  pendingCount,
  supplierCount,
}: YarnReceiptListProps) {
  const [filters, setFilters] = useState<YarnReceiptsFilter>({});
  const [page, setPage] = useState(1);

  const { data: result, isLoading, error } = useYarnReceiptList(filters, page);
  const receipts = result?.data ?? [];
  const deleteMutation = useDeleteYarnReceipt();
  const confirmMutation = useConfirmYarnReceipt();
  const { confirm } = useConfirm();
  const { profile } = useAuth();

  const canConfirm = profile?.role === 'admin' || profile?.role === 'manager';

  // Schema cho bộ lọc (Level 8 Architecture)
  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Số phiếu, nhà cung cấp, ghi chú...',
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Trạng thái',
      options: [
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
      ],
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
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

        <AddButton onClick={onNew} label="Tạo phiếu nhập" />
      </div>

      {/* KPI Dashboard */}
      <KpiGridPremium className="p-4 md:p-6 bg-surface-subtle border-b border-border">
        <KpiCardPremium
          variant="primary"
          label="Tổng lượng sợi nhập"
          value={`${totalWeight.toLocaleString('vi-VN')} kg`}
          icon="Package"
          footer="Cập nhật trong tháng này"
        />

        <KpiCardPremium
          variant="warning"
          label="Phiếu chờ xác nhận"
          value={pendingCount}
          icon="Activity"
          footer="Yêu cầu kiểm tra & xác nhận"
        />

        <KpiCardPremium
          variant="success"
          label="Nhà cung cấp"
          value={supplierCount}
          icon="Users"
          footer="Đối tác cung ứng hiện có"
        />
      </KpiGridPremium>

      {/* Filters (Config-Driven Pattern) */}
      <FilterBarPremium
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => setFilters({})}
      />

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
        emptyStateIcon={hasFilter ? 'Search' : 'Package'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo phiếu nhập' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            header: 'Số phiếu',
            id: 'receipt_number',
            sortable: true,
            cell: (r) => (
              <span className="font-bold text-primary">{r.receipt_number}</span>
            ),
          },
          {
            header: 'Nhà cung cấp',
            id: 'suppliers',
            sortable: true,
            accessor: (r) => r.suppliers?.name,
            cell: (r) => (
              <div className="flex flex-col">
                <span className="font-medium">{r.suppliers?.name ?? '—'}</span>
                <span className="text-xs text-muted">{r.suppliers?.code}</span>
              </div>
            ),
          },
          {
            header: 'Ngày nhập',
            id: 'receipt_date',
            sortable: true,
            cell: (r) => <span className="text-muted">{r.receipt_date}</span>,
          },
          {
            header: 'Tổng tiền',
            id: 'total_amount',
            sortable: true,
            className: 'text-right',
            cell: (r) => (
              <span className="font-medium">
                {formatCurrency(r.total_amount ?? 0)}đ
              </span>
            ),
          },
          {
            header: 'Trạng thái',
            id: 'status',
            sortable: true,
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
              <ActionBar
                actions={
                  [
                    r.status === 'draft' && canConfirm
                      ? {
                          icon: 'CheckCircle',
                          onClick: () => handleConfirmReceipt(r),
                          title: 'Xác nhận',
                          disabled: confirmMutation.isPending,
                        }
                      : null,
                    r.status === 'draft'
                      ? {
                          icon: 'Pencil',
                          onClick: () => onEdit(r),
                          title: 'Sửa',
                        }
                      : null,
                    r.status === 'draft'
                      ? {
                          icon: 'Trash2',
                          onClick: () => handleDelete(r),
                          title: 'Xóa',
                          variant: 'danger',
                          disabled: deleteMutation.isPending,
                        }
                      : null,
                    r.status !== 'draft'
                      ? {
                          icon: 'Eye',
                          onClick: () => onEdit(r),
                          title: 'Xem',
                        }
                      : null,
                  ].filter(Boolean) as ActionConfig[]
                }
              />
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
                    {formatCurrency(r.total_amount ?? 0)}đ
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                {r.status === 'draft' && canConfirm && (
                  <Button
                    variant="secondary"
                    className="flex-1 text-success"
                    leftIcon="CheckCircle"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmReceipt(r);
                    }}
                  >
                    Xác nhận
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="flex-1"
                  leftIcon={r.status === 'draft' ? 'Pencil' : 'Eye'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(r);
                  }}
                >
                  {r.status === 'draft' ? 'Sửa' : 'Chi tiết'}
                </Button>
                {r.status === 'draft' && (
                  <Button
                    variant="secondary"
                    className="text-danger px-3"
                    leftIcon="Trash2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(r);
                    }}
                    disabled={deleteMutation.isPending}
                  />
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
