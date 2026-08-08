import { useState, useCallback } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  DataTableAdvanced,
  AddButton,
  Button,
  ActionBar,
  FilterBar,
  KpiCard,
  KpiGrid,
  StatusBadge,
  Icon,
  type FilterFieldConfig,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatQuantity } from '@/shared/utils/format';
import { MoneyCell, MoneyText } from '@/shared/value';
import {
  useDeleteYarnReceipt,
  useYarnReceiptList,
  useConfirmYarnReceipt,
  useActiveSuppliers,
} from '@/application/inventory';
import { LIST_LABELS as MSG } from '@/features/yarn-receipts/yarn-receipts.constants';

import type { YarnReceipt, YarnReceiptsFilter } from './types';
import { getReceiptUnitPriceDisplay, getReceiptAvgUnitPrice } from './utils';
import { LotQRModal } from './components/LotQRModal';
import { LotBarcodeModal } from './components/LotBarcodeModal';

type YarnReceiptListProps = {
  onEdit: (receipt: YarnReceipt) => void;
  onNew: () => void;
  totalWeight: number;
  pendingCount: number;
  supplierCount: number;
};

export function YarnReceiptList({
  onEdit,
  onNew,
  totalWeight,
  pendingCount,
  supplierCount,
}: YarnReceiptListProps) {
  const [filters, setFilters] = useState<YarnReceiptsFilter>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [qrReceipt, setQrReceipt] = useState<YarnReceipt | null>(null);
  const [barcodeReceipt, setBarcodeReceipt] = useState<YarnReceipt | null>(
    null,
  );

  const {
    data: result,
    isLoading,
    error,
  } = useYarnReceiptList(filters, page, pageSize);
  const receipts = result?.data ?? [];
  const deleteMutation = useDeleteYarnReceipt();
  const confirmMutation = useConfirmYarnReceipt();
  const { data: suppliers } = useActiveSuppliers();
  const { confirm } = useConfirm();
  const { profile } = useAuth();

  const supplierOptions =
    suppliers?.map((s) => ({ value: s.id, label: s.name })) || [];

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
    {
      key: 'supplierId',
      type: 'combobox',
      label: 'Nhà cung cấp',
      options: supplierOptions,
    },
    {
      key: 'date',
      type: 'date_range',
      label: 'Ngày nhập',
      keyFrom: 'dateFrom',
      keyTo: 'dateTo',
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

  const hasFilter = !!(
    filters.search ||
    filters.status ||
    filters.supplierId ||
    filters.dateFrom ||
    filters.dateTo
  );

  const handleShowQR = useCallback((receipt: YarnReceipt) => {
    setQrReceipt(receipt);
  }, []);

  const handleShowBarcode = useCallback((receipt: YarnReceipt) => {
    setBarcodeReceipt(receipt);
  }, []);

  return (
    <>
      <div className="panel-card card-flush">
        {/* Action bar */}
        <div className="card-header-area">
          <AddButton onClick={onNew} label="Tạo phiếu nhập" />
        </div>

        {/* KPI Dashboard */}
        <KpiGrid className="kpi-section">
          <KpiCard
            variant="primary"
            label="Tổng lượng sợi nhập"
            value={`${formatQuantity(totalWeight)} kg`}
            icon="Package"
            footer="Cập nhật trong tháng này"
          />

          <KpiCard
            variant="warning"
            label="Phiếu chờ xác nhận"
            value={pendingCount}
            icon="Activity"
            footer={
              <span className="flex items-center gap-1 group-hover:text-warning-strong transition-colors">
                Lọc phiếu nháp <Icon name="ArrowRight" size={14} />
              </span>
            }
            onClick={() => handleFilterChange('status', 'draft')}
          />

          <KpiCard
            variant="success"
            label="Nhà cung cấp"
            value={supplierCount}
            icon="Users"
            footer="Đối tác cung ứng hiện có"
          />
        </KpiGrid>

        {/* Filters (Config-Driven Pattern) */}
        <FilterBar
          schema={filterSchema}
          value={filters}
          onChange={handleFilterChange}
          onClear={() => setFilters({})}
        />

        {/* Error */}
        {error && (
          <div className="p-4">
            <p className="error-inline">
              Lỗi tải dữ liệu:{' '}
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        )}

        {/* Table & Cards */}
        <DataTableAdvanced
          data={receipts}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          onRowClick={(r) => onEdit(r)}
          exportFileName="Phieu_nhap_soi"
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
              accessorKey: 'receipt_number',
              enableSorting: true,
              cell: ({ row }) => (
                <span className="font-bold text-foreground">
                  {row.original.receipt_number}
                </span>
              ),
            },
            {
              header: 'Nhà cung cấp',
              id: 'suppliers',
              accessorFn: (r) => r.suppliers?.name,
              enableSorting: true,
              cell: ({ row }) => (
                <div className="flex flex-col">
                  <span className="font-medium">
                    {row.original.suppliers?.name ?? '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {row.original.suppliers?.code}
                  </span>
                </div>
              ),
            },
            {
              header: 'Ngày nhập',
              accessorKey: 'receipt_date',
              enableSorting: true,
              cell: ({ row }) => (
                <span className="text-muted-foreground">
                  {row.original.receipt_date}
                </span>
              ),
            },
            {
              header: 'Đơn giá',
              id: 'unit_price',
              accessorFn: (r) => getReceiptAvgUnitPrice(r),
              enableSorting: true,
              meta: { className: 'text-right' },
              cell: ({ row }) => (
                <span className="text-muted-foreground">
                  {getReceiptUnitPriceDisplay(row.original)}
                </span>
              ),
            },
            {
              header: 'Tổng tiền',
              accessorKey: 'total_amount',
              enableSorting: true,
              meta: { className: 'text-right' },
              cell: ({ row }) => (
                <MoneyCell value={row.original.total_amount ?? 0} bold />
              ),
            },
            {
              header: 'Trạng thái',
              accessorKey: 'status',
              enableSorting: true,
              cell: ({ row }) => (
                <StatusBadge
                  domain="YARN_RECEIPT"
                  status={row.original.status}
                />
              ),
            },
            {
              header: 'Thao tác',
              id: 'actions',
              enableSorting: false,
              meta: { className: 'text-right' },
              cell: ({ row }) => {
                const r = row.original;
                return (
                  <div onClick={(e) => e.stopPropagation()}>
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
                          {
                            icon: 'QrCode',
                            onClick: () => handleShowQR(r),
                            title: 'QR Lô',
                          },
                          {
                            icon: 'Barcode',
                            onClick: () => handleShowBarcode(r),
                            title: 'Barcode Lô',
                          },
                        ].filter(Boolean) as ActionConfig[]
                      }
                    />
                  </div>
                );
              },
            },
          ]}
          renderMobileCard={(r) => (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <span className="mobile-card-title">{r.receipt_number}</span>
                <StatusBadge domain="YARN_RECEIPT" status={r.status} />
              </div>
              <div className="mobile-card-body space-y-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground">
                    {MSG.COL_SUPPLIER}
                  </span>
                  <span className="font-medium break-words">
                    {r.suppliers?.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pb-2 border-b border-border/10">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        {MSG.COL_RECEIPT_DATE}
                      </span>
                      <span className="font-medium text-sm">
                        {r.receipt_date}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        {MSG.COL_UNIT_PRICE}
                      </span>
                      <span className="font-medium text-sm">
                        {getReceiptUnitPriceDisplay(r)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col text-right justify-end">
                    <span className="text-xs text-muted-foreground">
                      {MSG.COL_TOTAL_AMOUNT}
                    </span>
                    <span className="font-bold text-foreground">
                      <MoneyText value={r.total_amount ?? 0} />
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
                  <Button
                    variant="secondary"
                    className="px-3"
                    leftIcon="QrCode"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowQR(r);
                    }}
                    title="QR Lô"
                  />
                  <Button
                    variant="secondary"
                    className="px-3"
                    leftIcon="Barcode"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowBarcode(r);
                    }}
                    title="Barcode Lô"
                  />
                </div>
              </div>
            </div>
          )}
          pagination={{
            result,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
            itemLabel: 'phiếu nhập',
          }}
        />
      </div>

      {qrReceipt && (
        <LotQRModal receipt={qrReceipt} onClose={() => setQrReceipt(null)} />
      )}
      {barcodeReceipt && (
        <LotBarcodeModal
          receipt={barcodeReceipt}
          onClose={() => setBarcodeReceipt(null)}
        />
      )}
    </>
  );
}
