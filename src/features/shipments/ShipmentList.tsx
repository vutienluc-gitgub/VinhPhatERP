import { useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Pagination';
import {
  Icon,
  Badge,
  type BadgeVariant,
  DataTablePremium,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

import { DeliveryConfirmForm } from './DeliveryConfirmForm';
import { exportShipmentToPdf } from './shipment-document';
import { SHIPMENT_STATUS_LABELS } from './shipments.module';
import type { Shipment, ShipmentsFilter, ShipmentStatus } from './types';
import {
  useConfirmShipment,
  useDeleteShipment,
  useExportShipmentPdf,
  useShipmentList,
} from './useShipments';

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

  const hasFilter = !!(filters.search || filters.status);

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
              )}
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  marginLeft: '0.2rem',
                }}
              >
                đ
              </span>
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
            <p style={{ color: '#b45309' }}>
              {shipments.filter((s) => s.status === 'preparing').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-bar card-filter-section">
        <div className="filter-grid-premium">
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
            <label>Trạng thái</label>
            <select
              className="field-select"
              value={filters.status ?? ''}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="preparing">Đang chuẩn bị</option>
              <option value="shipped">Đã giao</option>
              <option value="delivered">Đã nhận</option>
            </select>
          </div>
        </div>

        {hasFilter && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setFilters({});
              setSearchInput('');
              setPage(1);
            }}
            style={{
              marginTop: '1rem',
              color: 'var(--danger)',
              borderColor: 'rgba(192, 57, 43, 0.2)',
            }}
          >
            <Icon name="X" size={14} /> Xóa lọc nhanh
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
        emptyStateIcon={hasFilter ? '🔍' : '🚚'}
        columns={[
          {
            header: 'Số phiếu',
            cell: (s) => <strong>{s.shipment_number}</strong>,
          },
          {
            header: 'Đơn hàng',
            className: 'td-muted',
            cell: (s) => s.orders?.order_number ?? '—',
          },
          {
            header: 'Khách hàng',
            cell: (s) => s.customers?.name ?? '—',
          },
          {
            header: 'NV giao hàng',
            className: 'td-muted',
            cell: (s) =>
              s.delivery_staff?.full_name ?? (
                <span className="text-warning text-[0.82rem]">
                  Chưa phân công
                </span>
              ),
          },
          {
            header: 'Cước VC',
            className: 'td-muted',
            cell: (s) => {
              const totalCost = (s.shipping_cost || 0) + (s.loading_fee || 0);
              return totalCost ? `${formatCurrency(totalCost)}đ` : '—';
            },
          },
          {
            header: 'Ngày giao',
            className: 'td-muted',
            cell: (s) => s.shipment_date,
          },
          {
            header: 'Trạng thái',
            cell: (s) => (
              <Badge variant={getVariant(s.status)}>
                {SHIPMENT_STATUS_LABELS[s.status]}
              </Badge>
            ),
          },
          {
            header: '',
            className: 'td-actions',
            onCellClick: () => {},
            cell: (s) => (
              <div className="flex justify-end gap-1">
                {s.status === 'preparing' && (
                  <>
                    <button
                      className="btn-icon"
                      type="button"
                      onClick={() => void handleConfirm(s)}
                      disabled={confirmMutation.isPending}
                      title="Xác nhận & Mở PDF"
                    >
                      <Icon name="CheckCircle" size={16} />
                    </button>
                    <button
                      className="btn-icon danger"
                      type="button"
                      onClick={() => void handleDelete(s.id)}
                      disabled={deleteMutation.isPending}
                      title="Xóa"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </>
                )}
                {s.status !== 'preparing' && (
                  <button
                    className="btn-icon"
                    type="button"
                    onClick={() => void handleExportPdf(s)}
                    disabled={exportPdfMutation.isPending}
                    title="In PDF"
                  >
                    <Icon name="Printer" size={16} />
                  </button>
                )}
                {s.status === 'shipped' && (
                  <button
                    className="btn-primary h-8 px-2 text-[0.75rem] flex items-center gap-1"
                    type="button"
                    onClick={() => setDeliveryShipment(s)}
                  >
                    <Icon name="Check" size={14} /> Nhận hàng
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
                    <Icon name="Check" size={14} /> Nhận hàng
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
