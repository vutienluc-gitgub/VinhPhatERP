import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
  ClearFilterButton,
  ActionBar,
} from '@/shared/components';
import type { ActionConfig } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import {
  useConfirmShipment,
  useDeleteShipment,
  useExportShipmentPdf,
  useShipmentList,
  useDeliveryStaffList,
} from '@/application/shipments';
import { SHIPMENT_STATUS_LABELS } from '@/schema/shipment.schema';

import { DeliveryConfirmForm } from './DeliveryConfirmForm';
import { exportShipmentToPdf } from './shipment-document';
import type { Shipment, ShipmentsFilter, ShipmentStatus } from './types';

function getVariant(status: ShipmentStatus): BadgeVariant {
  switch (status) {
    case 'shipped':
      return 'info';
    case 'delivered':
      return 'success';
    case 'partially_returned':
      return 'purple';
    case 'returned':
      return 'danger';
    case 'preparing':
      return 'warning';
    default:
      return 'gray';
  }
}

export function ShipmentList() {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<ShipmentsFilter>({});
  const [page, setPage] = useState(1);
  const [deliveryShipment, setDeliveryShipment] = useState<Shipment | null>(
    null,
  );

  const { data: result, isLoading, error } = useShipmentList(filters, page);
  const shipments = result?.data ?? [];
  const confirmMutation = useConfirmShipment();
  const deleteMutation = useDeleteShipment();
  const exportPdfMutation = useExportShipmentPdf();
  const staffListResult = useDeliveryStaffList();
  const { confirm, alert: showAlert } = useConfirm();

  function getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Đã xảy ra lỗi không xác định.';
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  function handleStatusChange(val: string) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      status: (val as ShipmentStatus) || undefined,
    }));
  }

  function handleStaffChange(val: string) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      deliveryStaffId: val || undefined,
    }));
  }

  async function handleConfirm(shipment: Shipment) {
    const ok = await confirm({
      message: `Xác nhận xuất kho phiếu "${shipment.shipment_number}"? Hệ thống sẽ chuyển trạng thái sang Đã giao và mở phiếu PDF để in hoặc lưu.`,
    });
    if (!ok) return;

    try {
      const confirmedShipment = await confirmMutation.mutateAsync(shipment.id);
      try {
        exportShipmentToPdf(confirmedShipment);
      } catch (pdfError) {
        await showAlert(
          `Phiếu ${confirmedShipment.shipment_number} đã được xác nhận nhưng không thể mở trình in PDF. ${getErrorMessage(pdfError)}`,
          'Đã xác nhận shipment',
        );
      }
    } catch (error) {
      await showAlert(
        `Không thể xác nhận phiếu xuất. ${getErrorMessage(error)}`,
      );
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      message: 'Xoá phiếu xuất? Cuộn vải sẽ trả lại kho.',
      variant: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  }

  async function handleExportPdf(shipment: Shipment) {
    try {
      await exportPdfMutation.mutateAsync(shipment.id);
    } catch (error) {
      await showAlert(
        `Không thể tạo phiếu PDF cho ${shipment.shipment_number}. ${getErrorMessage(error)}`,
      );
    }
  }

  const hasFilter = !!(
    filters.search ||
    filters.status ||
    filters.deliveryStaffId
  );

  return (
    <div className="panel-card card-flush">
      {/* Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">KHO & GIAO HÀNG</p>
          <h3 className="title-premium">Quản lý Xuất kho</h3>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-grid-premium">
        <div className="stat-item-premium">
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'rgba(11, 107, 203, 0.1)',
              color: 'var(--primary)',
            }}
          >
            <Icon name="Truck" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>Số chuyến (Trang)</p>
            <p>{shipments.length}</p>
          </div>
        </div>

        <div className="stat-item-premium">
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'rgba(10, 128, 92, 0.1)',
              color: 'var(--success)',
            }}
          >
            <Icon name="Banknote" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>Tổng cước (Trang)</p>
            <p>
              {formatCurrency(
                shipments.reduce(
                  (sum, s) =>
                    sum + (s.shipping_cost || 0) + (s.loading_fee || 0),
                  0,
                ),
              )}{' '}
              đ
            </p>
          </div>
        </div>

        <div className="stat-item-premium">
          <div
            className="stat-icon-wrapper"
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
            }}
          >
            <Icon name="Clock" size={24} />
          </div>
          <div className="stat-content-premium">
            <p>Chờ xác nhận</p>
            <p>{shipments.filter((s) => s.status === 'preparing').length}</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-bar card-filter-section flex-col items-start gap-4">
        <div className="filter-grid-premium w-full">
          <div className="filter-field">
            <label>Tìm kiếm</label>
            <form className="search-input-wrapper" onSubmit={handleSearch}>
              <input
                className="field-input"
                type="text"
                placeholder="Số phiếu xuất..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={handleSearch}
              />
              <button type="submit" style={{ display: 'none' }}></button>
              <Icon name="Search" size={16} className="search-input-icon" />
            </form>
          </div>

          <div className="filter-field">
            <label>Tài xế giao hàng</label>
            <select
              className="field-select"
              value={filters.deliveryStaffId ?? ''}
              onChange={(e) => handleStaffChange(e.target.value)}
            >
              <option value="">Tất cả tài xế</option>
              {staffListResult.data?.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="flex bg-muted/50 p-1 rounded-md w-fit border border-border/50">
            {[
              {
                label: 'Tất cả',
                value: '',
              },
              {
                label: 'Đang chuẩn bị',
                value: 'preparing',
              },
              {
                label: 'Đang đi giao',
                value: 'shipped',
              },
              {
                label: 'Đã nhận hàng',
                value: 'delivered',
              },
            ].map((tab) => {
              const isActive = (filters.status || '') === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleStatusChange(tab.value)}
                  className={`px-4 py-1.5 text-[0.82rem] font-medium rounded transition-all ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {hasFilter && (
            <ClearFilterButton
              onClick={() => {
                setFilters({});
                setSearchInput('');
                setPage(1);
              }}
              label="Xóa lọc nhanh"
            />
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Table & Cards */}
      <DataTablePremium
        data={shipments}
        isLoading={isLoading}
        rowKey={(s) => s.id}
        emptyStateTitle={
          hasFilter ? 'Không tìm thấy phiếu xuất' : 'Chưa có phiếu xuất kho'
        }
        emptyStateDescription={
          hasFilter
            ? 'Hãy thử thay đổi tiêu chí tìm kiếm.'
            : 'Sẽ có dữ liệu ở đây khi có yêu cầu chuyển hàng hoặc đơn giao cần xử lý.'
        }
        emptyStateIcon={hasFilter ? 'Search' : 'Truck'}
        columns={[
          {
            header: 'Mã & Trạng thái',
            cell: (s) => (
              <div className="flex flex-col gap-1 items-start">
                <Badge variant={getVariant(s.status)}>
                  {SHIPMENT_STATUS_LABELS[s.status]}
                </Badge>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-muted-foreground text-[0.75rem] font-medium">
                    #{s.shipment_number}
                  </span>
                  {s.orders?.order_number && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-muted-foreground text-[0.75rem]">
                        {s.orders.order_number}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ),
          },
          {
            header: 'Thời gian & Cước',
            cell: (s) => {
              const totalCost = (s.shipping_cost || 0) + (s.loading_fee || 0);
              const dateParts = s.shipment_date.split('-');
              const displayDate =
                dateParts.length === 3
                  ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
                  : s.shipment_date;

              return (
                <div className="flex flex-col gap-1 items-start">
                  <span className="font-semibold text-foreground text-[0.85rem]">
                    {displayDate}
                  </span>
                  <span className="text-muted-foreground text-[0.75rem] mt-1">
                    Cước:{' '}
                    <span className="font-medium text-foreground">
                      {totalCost ? `${formatCurrency(totalCost)}đ` : '—'}
                    </span>
                  </span>
                </div>
              );
            },
          },
          {
            header: 'Lộ trình',
            className: 'w-[280px]',
            cell: (s) => {
              const origin = 'Kho Vĩnh Phát';
              const isCompleted = s.status === 'delivered';
              const destination =
                s.delivery_address ||
                s.customers?.address ||
                s.customers?.name ||
                'Chưa rõ địa chỉ đích';

              return (
                <div className="flex bg-transparent w-full group cursor-default">
                  <div className="flex flex-col items-center mr-3 mt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 ring-2 ring-slate-100 dark:ring-slate-800" />
                    <div className="w-[1.5px] h-[22px] bg-slate-200 border-l border-dashed border-slate-300 dark:border-slate-600 my-0.5" />
                    <div
                      className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${isCompleted ? 'bg-success' : s.status === 'preparing' ? 'bg-slate-300' : 'bg-orange-500 animate-pulse'}`}
                    />
                  </div>
                  <div className="flex w-[220px] flex-col justify-between py-[1px]">
                    <span
                      className="text-[0.85rem] font-medium text-foreground truncate"
                      title={origin}
                    >
                      {origin}
                    </span>
                    <span
                      className="text-[0.85rem] text-muted-foreground truncate mt-1.5 transition-colors group-hover:text-foreground"
                      title={destination}
                    >
                      {destination}
                    </span>
                  </div>
                </div>
              );
            },
          },
          {
            header: 'Tài xế',
            cell: (s) => {
              if (!s.delivery_staff) {
                return (
                  <span className="text-warning text-[0.82rem] font-medium">
                    [Tìm tài xế] Chưa phân công
                  </span>
                );
              }
              return (
                <div className="flex flex-col gap-1 items-start">
                  <span className="font-semibold text-foreground text-[0.85rem]">
                    {s.delivery_staff.full_name}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                    <Icon name="Phone" size={12} />
                    <span className="text-[0.75rem]">
                      {s.delivery_staff.phone || 'Không rõ sđt'}
                    </span>
                  </div>
                </div>
              );
            },
          },
          {
            header: '',
            className: 'td-actions',
            onCellClick: () => {},
            cell: (s) => (
              <div className="flex justify-end gap-1 items-center">
                <ActionBar
                  actions={
                    [
                      s.status === 'preparing'
                        ? {
                            icon: 'CheckCircle',
                            onClick: () => void handleConfirm(s),
                            title: 'Xác nhận & Mở PDF',
                            disabled: confirmMutation.isPending,
                          }
                        : null,
                      s.status === 'preparing'
                        ? {
                            icon: 'Trash2',
                            onClick: () => void handleDelete(s.id),
                            title: 'Xóa',
                            variant: 'danger',
                            disabled: deleteMutation.isPending,
                          }
                        : null,
                      s.status !== 'preparing'
                        ? {
                            icon: 'Printer',
                            onClick: () => void handleExportPdf(s),
                            title: 'In PDF',
                            disabled: exportPdfMutation.isPending,
                          }
                        : null,
                    ].filter(Boolean) as ActionConfig[]
                  }
                />
                {s.status === 'shipped' && (
                  <button
                    className="btn-primary h-8 px-2 text-[0.75rem] flex items-center gap-1"
                    type="button"
                    onClick={() => setDeliveryShipment(s)}
                  >
                    <Icon name="Check" size={16} /> Nhận hàng
                  </button>
                )}
              </div>
            ),
          },
        ]}
        renderMobileCard={(s) => {
          const totalCost = (s.shipping_cost || 0) + (s.loading_fee || 0);
          return (
            <div className="mobile-card">
              <div className="mobile-card-header">
                <span className="mobile-card-title">{s.shipment_number}</span>
                <Badge variant={getVariant(s.status)}>
                  {SHIPMENT_STATUS_LABELS[s.status]}
                </Badge>
              </div>
              <div className="mobile-card-body">
                <div className="mobile-card-row">
                  <span className="label">Đơn hàng:</span>
                  <span className="value">{s.orders?.order_number ?? '—'}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="label">Khách hàng:</span>
                  <span className="value">{s.customers?.name ?? '—'}</span>
                </div>
                {s.delivery_staff && (
                  <div className="mobile-card-row">
                    <span className="label">Giao hàng:</span>
                    <span className="value">{s.delivery_staff.full_name}</span>
                  </div>
                )}
                <div className="mobile-card-row border-t border-border mt-2 pt-2">
                  <span className="label font-bold">Cước VC:</span>
                  <span className="value font-bold text-primary">
                    {totalCost ? `${formatCurrency(totalCost)}đ` : '—'}
                  </span>
                </div>
              </div>
              <div className="mobile-card-actions">
                {s.status === 'preparing' && (
                  <>
                    <button
                      className="btn-secondary flex-1 text-success"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleConfirm(s);
                      }}
                      disabled={confirmMutation.isPending}
                    >
                      <Icon name="CheckCircle" size={16} /> Xác nhận
                    </button>
                    <button
                      className="btn-secondary flex-1 text-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(s.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Icon name="Trash2" size={16} /> Xóa
                    </button>
                  </>
                )}
                {s.status !== 'preparing' && (
                  <button
                    className="btn-secondary flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleExportPdf(s);
                    }}
                    disabled={exportPdfMutation.isPending}
                  >
                    <Icon name="Printer" size={16} /> In PDF
                  </button>
                )}
                {s.status === 'shipped' && (
                  <button
                    className="btn-primary flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeliveryShipment(s);
                    }}
                  >
                    <Icon name="Check" size={16} /> Nhận hàng
                  </button>
                )}
              </div>
            </div>
          );
        }}
      />

      {(confirmMutation.error ||
        deleteMutation.error ||
        exportPdfMutation.error) && (
        <p className="error-inline-sm">
          Lỗi:{' '}
          {
            (
              (confirmMutation.error ||
                deleteMutation.error ||
                exportPdfMutation.error) as Error
            ).message
          }
        </p>
      )}

      <Pagination result={result} onPageChange={setPage} />

      {/* Delivery confirm modal */}
      {deliveryShipment && (
        <DeliveryConfirmForm
          shipment={deliveryShipment}
          onClose={() => setDeliveryShipment(null)}
        />
      )}
    </div>
  );
}
