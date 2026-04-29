import { ProgressTimeline } from '@/features/orders/progress/ProgressTimeline';
import { useOrderProgress } from '@/application/orders';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/format';
import {
  calculateBalanceDue,
  calculatePaymentPercentage,
} from '@/domain/payments';
import {
  useCancelOrder,
  useCompleteOrder,
  useConfirmOrder,
  useOrder,
  useApproveOrderRequest,
  useRejectOrderRequest,
} from '@/application/orders';
import { ORDER_STATUS_LABELS } from '@/schema/order.schema';
import { isOrderEditable } from '@/domain/orders/OrderStateMachine';
import { useAuth } from '@/shared/hooks/useAuth';

import { OrderAuditLogViewer } from './OrderAuditLogViewer';
import type { Order, OrderStatus } from './types';

type OrderDetailProps = {
  orderId: string;
  onBack: () => void;
  onEdit: (order: Order) => void;
  onCreateShipment: (order: Order) => void;
  onCreatePayment: (order: Order) => void;
  onReserveRolls: (order: Order) => void;
  onCreateContract: (order: Order) => void;
};

function statusClass(status: OrderStatus): string {
  switch (status) {
    case 'confirmed':
      return 'reserved';
    case 'in_progress':
      return 'in_process';
    case 'completed':
      return 'in_stock';
    case 'cancelled':
      return 'damaged';
    default:
      return 'shipped';
  }
}

export function OrderDetail({
  orderId,
  onBack,
  onEdit,
  onCreateShipment,
  onCreatePayment,
  onReserveRolls,
  onCreateContract,
}: OrderDetailProps) {
  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: progressStages = [] } = useOrderProgress(orderId);
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const confirmMutation = useConfirmOrder();
  const cancelMutation = useCancelOrder();
  const completeMutation = useCompleteOrder();
  const approveMutation = useApproveOrderRequest();
  const rejectMutation = useRejectOrderRequest();
  const { confirm } = useConfirm();

  if (isLoading)
    return (
      <div className="panel-card">
        <p className="table-empty">Đang tải...</p>
      </div>
    );
  if (error)
    return (
      <div className="panel-card">
        <p className="error-inline">Lỗi: {(error as Error).message}</p>
      </div>
    );
  if (!order)
    return (
      <div className="panel-card">
        <p className="table-empty">Không tìm thấy đơn hàng.</p>
      </div>
    );

  const balanceDue = calculateBalanceDue(order.total_amount, order.paid_amount);
  const items = order.order_items ?? [];
  const paymentPct = calculatePaymentPercentage(
    order.total_amount,
    order.paid_amount,
  );

  async function handleConfirm() {
    const ok = await confirm({
      message:
        'Xác nhận đơn hàng? Hệ thống sẽ tạo 7 công đoạn tiến độ tự động.',
    });
    if (!ok) return;
    confirmMutation.mutate(orderId);
  }

  async function handleCancel() {
    const ok = await confirm({
      message: 'Hủy đơn hàng này?',
      variant: 'danger',
    });
    if (!ok) return;
    cancelMutation.mutate(orderId);
  }

  async function handleComplete() {
    const ok = await confirm({ message: 'Hoàn thành đơn hàng?' });
    if (!ok) return;
    completeMutation.mutate(orderId);
  }

  async function handleApprove() {
    const ok = await confirm({
      message: 'Chấp nhận đơn yêu cầu này và chuyển thành đơn nháp?',
    });
    if (!ok) return;
    approveMutation.mutate(orderId);
  }

  async function handleReject() {
    const ok = await confirm({
      message: 'Từ chối đơn yêu cầu này?',
      variant: 'danger',
    });
    if (!ok) return;
    rejectMutation.mutate(orderId);
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="secondary" leftIcon="ArrowLeft" onClick={onBack}>
            Quay lại
          </Button>
          <div className="flex-1">
            <h3 className="m-0">{order.order_number}</h3>
            <span className="td-muted">{order.customers?.name ?? '—'}</span>
          </div>
          <span className={`roll-status ${statusClass(order.status)}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Info grid */}
        <div className="dashboard-summary-row mb-4">
          <div>
            <div className="td-muted summary-label">Ngày đặt</div>
            <div>{order.order_date}</div>
          </div>
          <div>
            <div className="td-muted summary-label">Ngày giao</div>
            <div>{order.delivery_date ?? '—'}</div>
          </div>
          <div>
            <div className="td-muted summary-label">Tổng tiền</div>
            <div className="summary-value">
              {formatCurrency(order.total_amount)} đ
            </div>
          </div>
          <div>
            <div className="td-muted summary-label">Đã thu</div>
            <div className="summary-value text-[var(--success)]">
              {formatCurrency(order.paid_amount)} đ
            </div>
          </div>
          <div>
            <div className="td-muted summary-label">Còn nợ</div>
            <div
              className={`summary-value${balanceDue > 0 ? ' summary-value--danger' : ''}`}
            >
              {formatCurrency(balanceDue)} đ
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="info-box mb-4">
            <strong>Ghi chú:</strong> {order.notes}
          </div>
        )}

        {/* Payment progress bar */}
        {order.total_amount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Thanh toán</span>
              <span>{paymentPct}%</span>
            </div>
            <div className="h-2 bg-border rounded">
              <div
                className={`h-full rounded transition-all duration-300 ${balanceDue <= 0 ? 'bg-[#0c8f68]' : 'bg-[#0b6bcb]'}`}
                style={{ width: `${paymentPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {order.status === 'pending_review' && (
            <>
              <Button
                variant="primary"
                leftIcon="CheckCircle"
                onClick={handleApprove}
                isLoading={approveMutation.isPending}
              >
                Duyệt yêu cầu
              </Button>
              <Button
                variant="secondary"
                leftIcon="X"
                onClick={handleReject}
                isLoading={rejectMutation.isPending}
                className="text-danger"
              >
                Từ chối
              </Button>
            </>
          )}

          {isOrderEditable(order.status, isAdmin) && (
            <>
              <Button
                variant="secondary"
                leftIcon="Pencil"
                onClick={() => onEdit(order)}
              >
                Sửa đơn
              </Button>
              {order.status === 'draft' && (
                <Button
                  variant="primary"
                  leftIcon="CheckCircle"
                  onClick={handleConfirm}
                  isLoading={confirmMutation.isPending}
                >
                  Xác nhận đơn
                </Button>
              )}
            </>
          )}
          {(order.status === 'confirmed' || order.status === 'in_progress') && (
            <>
              <Button
                variant="secondary"
                leftIcon="Lock"
                onClick={() => onReserveRolls(order)}
              >
                Giữ cuộn
              </Button>
              <Button
                variant="primary"
                leftIcon="Package"
                onClick={() => onCreateShipment(order)}
              >
                Tạo phiếu xuất
              </Button>
              <Button
                variant="outline"
                leftIcon="CircleDollarSign"
                onClick={() => onCreatePayment(order)}
              >
                Thu tiền
              </Button>
            </>
          )}
          {order.status === 'in_progress' && (
            <Button
              variant="secondary"
              leftIcon="Check"
              onClick={handleComplete}
              isLoading={completeMutation.isPending}
            >
              Hoàn thành
            </Button>
          )}
          {order.status !== 'cancelled' && (
            <Button
              variant="secondary"
              leftIcon="FileText"
              onClick={() => onCreateContract(order)}
            >
              Tạo hợp đồng
            </Button>
          )}
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <Button
              variant="secondary"
              leftIcon="Trash2"
              onClick={handleCancel}
              isLoading={cancelMutation.isPending}
              className="text-danger"
            >
              Hủy đơn
            </Button>
          )}
        </div>

        {(confirmMutation.error ||
          cancelMutation.error ||
          completeMutation.error) && (
          <p className="error-inline text-sm">
            Lỗi:{' '}
            {
              (
                (confirmMutation.error ||
                  cancelMutation.error ||
                  completeMutation.error) as Error
              ).message
            }
          </p>
        )}
      </div>

      {/* Order items table */}
      <div className="px-5 pb-5">
        <h4 className="mb-3">Dòng hàng ({items.length})</h4>
        <div className="data-table-wrap">
          {items.length === 0 ? (
            <p className="table-empty">Chưa có dòng hàng.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Loại vải</th>
                  <th>Màu</th>
                  <th className="text-right">Số lượng</th>
                  <th className="text-right">Đơn giá (đ)</th>
                  <th className="text-right">Thành tiền (đ)</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item, idx) => (
                    <tr key={item.id}>
                      <td className="td-muted">{idx + 1}</td>
                      <td>
                        <strong>{item.fabric_type}</strong>
                      </td>
                      <td className="td-muted">{item.color_name ?? '—'}</td>
                      <td className="numeric-cell">
                        {new Intl.NumberFormat('vi-VN').format(item.quantity)}{' '}
                        {item.unit}
                      </td>
                      <td className="numeric-cell">
                        {formatCurrency(item.unit_price)}đ
                      </td>
                      <td className="numeric-cell font-bold">
                        {formatCurrency(item.amount ?? 0)}đ
                      </td>
                    </tr>
                  ))}
                <tr>
                  <td colSpan={5} className="text-right font-bold">
                    Tổng cộng
                  </td>
                  <td className="numeric-cell font-bold">
                    {formatCurrency(order.total_amount)} đ
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Production progress timeline */}
      {progressStages.length > 0 && (
        <div className="px-5 pb-5">
          <h4 className="mb-3">Tiến độ sản xuất</h4>
          <ProgressTimeline
            stages={progressStages}
            readonly={
              order.status === 'cancelled' || order.status === 'completed'
            }
          />
        </div>
      )}

      {/* Lịch sử hoạt động (Audit Logs) */}
      <OrderAuditLogViewer orderId={orderId} />
    </div>
  );
}
