import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  AddButton,
  ActionBar,
  FilterBarPremium,
  type FilterFieldConfig,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import {
  useWeavingInvoiceList,
  useConfirmWeavingInvoice,
  useDeleteWeavingInvoice,
} from '@/application/production';
import { WEAVING_STATUS_LABELS } from '@/schema/weaving-invoice.schema';

import type { WeavingInvoice, WeavingInvoiceFilter } from './types';

type Props = {
  onNew: () => void;
  onEdit: (invoice: WeavingInvoice) => void;
};

function getStatusVariant(status: string): BadgeVariant {
  if (status === 'confirmed') return 'success';
  if (status === 'paid') return 'info';
  return 'gray';
}

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n));
}

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
      label: 'Tìm kiếm',
      placeholder: 'Số phiếu gia công...',
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
          value: 'paid',
          label: 'Đã thanh toán',
        },
      ],
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  return (
    <div className="panel-card card-flush">
      {/* Action bar */}
      <div className="card-header-area">
        <AddButton onClick={onNew} label="Tạo phiếu" />
      </div>

      {/* KPI */}
      <div className="kpi-section kpi-grid">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng phiếu gia công</p>
              <p className="kpi-value">{result?.total ?? 0}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Package" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Tất cả phiếu nhập kho dệt
          </div>
        </div>

        <div className="kpi-card-premium kpi-warning">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Chờ xác nhận</p>
              <p className="kpi-value">
                {invoices.filter((inv) => inv.status === 'draft').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Clock" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Phiếu nháp chưa nhập kho
          </div>
        </div>
      </div>

      {/* Filters (Config-Driven) */}
      <FilterBarPremium
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={() => {
          clearFilters();
          setPage(1);
        }}
      />

      {/* Errors */}
      {error && (
        <div className="p-4">
          <p className="error-inline">Lỗi: {(error as Error).message}</p>
        </div>
      )}
      {confirmMutation.error && (
        <div className="p-4">
          <p className="error-inline">
            {(confirmMutation.error as Error).message}
          </p>
        </div>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={invoices}
        isLoading={isLoading}
        rowKey={(inv) => inv.id}
        emptyStateTitle={
          hasFilter
            ? 'Không tìm thấy phiếu gia công'
            : 'Chưa có phiếu gia công nào'
        }
        emptyStateDescription={
          hasFilter
            ? 'Thử điều chỉnh bộ lọc.'
            : 'Nhấn "+ Tạo phiếu" để bắt đầu nhập cuộn vải từ nhà dệt.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Package'}
        emptyStateActionLabel={!hasFilter ? '+ Tạo phiếu' : undefined}
        onEmptyStateAction={!hasFilter ? onNew : undefined}
        columns={[
          {
            id: 'invoice_number',
            sortable: true,
            accessor: (inv) => inv.invoice_number,
            header: 'Số phiếu',
            cell: (inv) => (
              <div className="flex flex-col">
                <span className="font-bold text-primary">
                  {inv.invoice_number}
                </span>
                <span className="text-xs text-muted mt-0.5">
                  {inv.invoice_date}
                </span>
              </div>
            ),
          },
          {
            id: 'supplier',
            sortable: true,
            accessor: (inv) => inv.suppliers?.name || '',
            header: 'Nhà dệt',
            cell: (inv) => (
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">
                  {inv.suppliers?.name ?? '—'}
                </span>
                {inv.suppliers?.code && (
                  <span className="text-xs font-semibold text-primary/80 mt-0.5">
                    {inv.suppliers.code}
                  </span>
                )}
              </div>
            ),
          },
          {
            id: 'fabric_type',
            sortable: true,
            accessor: (inv) => inv.fabric_type,
            header: 'Loại vải',
            cell: (inv) => (
              <span className="font-medium">{inv.fabric_type}</span>
            ),
          },
          {
            id: 'total_weight_kg',
            sortable: true,
            accessor: (inv) => inv.total_weight_kg,
            header: 'Tổng KG',
            className: 'text-right',
            cell: (inv) => (
              <span className="font-bold">{fmt(inv.total_weight_kg)} kg</span>
            ),
          },
          {
            id: 'total_amount',
            sortable: true,
            accessor: (inv) => inv.total_amount,
            header: 'Thành tiền',
            className: 'text-right',
            cell: (inv) => (
              <span className="font-bold">{fmt(inv.total_amount)}đ</span>
            ),
          },
          {
            id: 'paid_amount',
            sortable: true,
            accessor: (inv) => inv.paid_amount,
            header: 'Đã trả',
            className: 'text-right',
            cell: (inv) => (
              <span
                className={`font-medium ${inv.paid_amount > 0 ? 'text-success' : 'text-muted'}`}
              >
                {fmt(inv.paid_amount)}đ
              </span>
            ),
          },
          {
            id: 'status',
            sortable: true,
            accessor: (inv) => inv.status,
            header: 'Trạng thái',
            cell: (inv) => (
              <Badge variant={getStatusVariant(inv.status)}>
                {WEAVING_STATUS_LABELS[inv.status]}
              </Badge>
            ),
          },
          {
            header: 'Thao tác',
            className: 'text-right',
            onCellClick: () => {},
            cell: (inv) => (
              <ActionBar
                actions={
                  [
                    inv.status === 'draft'
                      ? {
                          icon: 'Pencil',
                          onClick: () => onEdit(inv),
                          title: 'Sửa',
                        }
                      : null,
                    inv.status === 'draft'
                      ? {
                          icon: 'CheckCircle',
                          onClick: () => handleConfirm(inv),
                          title: 'Xác nhận & nhập kho',
                          disabled: confirmMutation.isPending,
                        }
                      : null,
                    inv.status === 'draft'
                      ? {
                          icon: 'Trash2',
                          onClick: () => handleDelete(inv),
                          title: 'Xóa',
                          variant: 'danger',
                          disabled: deleteMutation.isPending,
                        }
                      : null,
                  ].filter(Boolean) as ActionConfig[]
                }
              />
            ),
          },
        ]}
        renderMobileCard={(inv) => (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <div className="flex flex-col">
                <span className="mobile-card-title">{inv.invoice_number}</span>
                <span className="text-xs text-muted">{inv.invoice_date}</span>
              </div>
              <Badge variant={getStatusVariant(inv.status)}>
                {WEAVING_STATUS_LABELS[inv.status]}
              </Badge>
            </div>
            <div className="mobile-card-body space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Nhà dệt</span>
                  <span className="font-bold">
                    {inv.suppliers?.name ?? '—'}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">Loại vải</span>
                  <span className="font-medium">{inv.fabric_type}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">Tổng KG</span>
                  <span className="font-bold">{fmt(inv.total_weight_kg)}</span>
                </div>
                <div className="flex flex-col text-center">
                  <span className="text-xs text-muted">Thành tiền</span>
                  <span className="font-bold text-primary">
                    {fmt(inv.total_amount)}đ
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted">Đã trả</span>
                  <span
                    className={`font-bold ${inv.paid_amount > 0 ? 'text-success' : 'text-muted'}`}
                  >
                    {fmt(inv.paid_amount)}đ
                  </span>
                </div>
              </div>

              {inv.status === 'draft' && (
                <div className="flex gap-2 pt-3 mt-1 border-t border-border/10">
                  <button
                    className="btn-secondary flex-1 text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(inv);
                    }}
                  >
                    <Icon name="Pencil" size={16} /> Sửa
                  </button>
                  <button
                    className="btn-secondary flex-1 text-success border-success/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirm(inv);
                    }}
                    disabled={confirmMutation.isPending}
                  >
                    <Icon name="CheckCircle" size={16} /> Xác nhận
                  </button>
                  <button
                    className="btn-secondary text-danger border-danger/20 px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(inv);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      />

      <Pagination result={result} onPageChange={setPage} />
    </div>
  );
}
