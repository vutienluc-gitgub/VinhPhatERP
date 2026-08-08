import { ProgressTimeline } from '@/features/orders/progress/ProgressTimeline';
import { useOrderProgress } from '@/application/orders';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { Button } from '@/shared/components/Button';
import { MoneyText, QuantityText } from '@/shared/value';
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
  useConfirmTradingOrder,
  useCancelTradingOrder,
} from '@/application/orders';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_VARIANTS,
  ORDER_TYPE_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from '@/schema/order.schema';
import type { ProductCategory } from '@/schema/order.schema';
import { isOrderEditable } from '@/domain/orders/OrderStateMachine';
import { useAuth } from '@/shared/hooks/useAuth';
import { Badge } from '@/shared/components/Badge';
import { ChatWidget } from '@/features/chat';

import { OrderAuditLogViewer } from './OrderAuditLogViewer';
import type { Order } from './types';
import {
  ORDERS_FORM_LABELS,
  ORDERS_PROG_LABELS,
  ORDERS_RES_LABELS,
  ORDERS_LIST_LABELS,
} from './orders.constants';

type OrderDetailProps = {
  orderId: string;
  onBack: () => void;
  onEdit: (order: Order) => void;
  onCreateShipment: (order: Order) => void;
  onCreatePayment: (order: Order) => void;
  onReserveRolls: (order: Order) => void;
  onCreateContract: (order: Order) => void;
};

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
  const tradingConfirmMutation = useConfirmTradingOrder();
  const cancelMutation = useCancelOrder();
  const tradingCancelMutation = useCancelTradingOrder();
  const completeMutation = useCompleteOrder();
  const approveMutation = useApproveOrderRequest();
  const rejectMutation = useRejectOrderRequest();
  const { confirm } = useConfirm();
  const actionError =
    confirmMutation.error ||
    tradingConfirmMutation.error ||
    cancelMutation.error ||
    tradingCancelMutation.error ||
    completeMutation.error;

  if (isLoading)
    return (
      <div className="panel-card">
        <p className="table-empty">{ORDERS_PROG_LABELS.PROG_LOADING}</p>
      </div>
    );
  if (error)
    return (
      <div className="panel-card">
        <p className="error-inline">
          {ORDERS_FORM_LABELS.ERROR_PREFIX}
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  if (!order)
    return (
      <div className="panel-card">
        <p className="table-empty">{ORDERS_LIST_LABELS.ERR_NOT_FOUND}</p>
      </div>
    );

  const balanceDue = calculateBalanceDue(order.total_amount, order.paid_amount);
  const items = order.order_items ?? [];
  const paymentPct = calculatePaymentPercentage(
    order.total_amount,
    order.paid_amount,
  );

  async function handleConfirm() {
    const isTrading = order?.order_type === 'trading';
    const ok = await confirm({
      message: isTrading
        ? ORDERS_LIST_LABELS.CONFIRM_TRADING
        : ORDERS_LIST_LABELS.CONFIRM_PRODUCTION,
    });
    if (!ok) return;

    if (isTrading) {
      tradingConfirmMutation.mutate(orderId);
    } else {
      confirmMutation.mutate(orderId);
    }
  }

  async function handleCancel() {
    const isTrading = order?.order_type === 'trading';
    const ok = await confirm({
      message: isTrading
        ? ORDERS_LIST_LABELS.CONFIRM_CANCEL_TRADING
        : ORDERS_LIST_LABELS.CONFIRM_CANCEL,
      variant: 'danger',
    });
    if (!ok) return;

    if (isTrading) {
      tradingCancelMutation.mutate(orderId);
    } else {
      cancelMutation.mutate(orderId);
    }
  }

  async function handleComplete() {
    const ok = await confirm({ message: ORDERS_LIST_LABELS.CONFIRM_COMPLETE });
    if (!ok) return;
    completeMutation.mutate(orderId);
  }

  async function handleApprove() {
    const ok = await confirm({
      message: ORDERS_LIST_LABELS.CONFIRM_APPROVE_REQ,
    });
    if (!ok) return;
    approveMutation.mutate(orderId);
  }

  async function handleReject() {
    const ok = await confirm({
      message: ORDERS_LIST_LABELS.CONFIRM_REJECT_REQ,
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
            {ORDERS_LIST_LABELS.BTN_BACK}
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="m-0">{order.order_number}</h3>
              <Badge variant="gray">
                {ORDER_TYPE_LABELS[
                  order.order_type as keyof typeof ORDER_TYPE_LABELS
                ] ?? ORDERS_LIST_LABELS.TYPE_PRODUCTION}
              </Badge>
            </div>
            <span className="text-muted-foreground text-sm">
              {order.customers?.name ?? '—'}
            </span>
          </div>
          <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status] ?? 'gray'}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>

        {/* Info grid */}
        <div className="dashboard-summary-row mb-4">
          <div>
            <div className="text-muted-foreground text-sm summary-label">
              {ORDERS_LIST_LABELS.LBL_ORDER_DATE}
            </div>
            <div>{order.order_date}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm summary-label">
              {ORDERS_LIST_LABELS.LBL_DELIVERY_DATE}
            </div>
            <div>{order.delivery_date ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm summary-label">
              {ORDERS_FORM_LABELS.LBL_TOTAL_AMOUNT}
            </div>
            <div className="summary-value">
              <MoneyText value={order.total_amount} suffix="đ" />
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm summary-label">
              {ORDERS_LIST_LABELS.LBL_PAID_AMOUNT}
            </div>
            <div className="summary-value text-[var(--success)]">
              <MoneyText value={order.paid_amount} suffix="đ" />
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm summary-label">
              {ORDERS_FORM_LABELS.LBL_BALANCE_DUE}
            </div>
            <div
              className={`summary-value${balanceDue > 0 ? ' summary-value--danger' : ''}`}
            >
              <MoneyText value={balanceDue} suffix="đ" />
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="info-box mb-4">
            <strong>{ORDERS_LIST_LABELS.LBL_NOTES_PREFIX}</strong> {order.notes}
          </div>
        )}

        {/* Payment progress bar */}
        {order.total_amount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>{ORDERS_LIST_LABELS.LBL_PAYMENT_PROGRESS}</span>
              <span>{paymentPct}%</span>
            </div>
            <div className="h-2 bg-border rounded">
              <div
                className={`h-full rounded transition-all duration-300 ${balanceDue <= 0 ? 'bg-success' : 'bg-primary'}`}
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
                {ORDERS_LIST_LABELS.BTN_APPROVE_REQ}
              </Button>
              <Button
                variant="secondary"
                leftIcon="X"
                onClick={handleReject}
                isLoading={rejectMutation.isPending}
                className="text-danger"
              >
                {ORDERS_LIST_LABELS.BTN_REJECT_REQ}
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
                {ORDERS_LIST_LABELS.BTN_EDIT}
              </Button>
              {order.status === 'draft' && (
                <Button
                  variant="primary"
                  leftIcon="CheckCircle"
                  onClick={handleConfirm}
                  isLoading={
                    confirmMutation.isPending ||
                    tradingConfirmMutation.isPending
                  }
                >
                  {order.order_type === 'trading'
                    ? ORDERS_LIST_LABELS.BTN_CONFIRM_TRADING
                    : ORDERS_LIST_LABELS.BTN_CONFIRM}
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
                {ORDERS_RES_LABELS.RES_BTN_RESERVE}
              </Button>
              <Button
                variant="primary"
                leftIcon="Package"
                onClick={() => onCreateShipment(order)}
              >
                {ORDERS_LIST_LABELS.BTN_SHIP}
              </Button>
              <Button
                variant="outline"
                leftIcon="CircleDollarSign"
                onClick={() => onCreatePayment(order)}
              >
                {ORDERS_LIST_LABELS.BTN_PAY}
              </Button>
            </>
          )}
          {(order.status === 'in_progress' ||
            (order.status === 'confirmed' &&
              order.order_type === 'trading')) && (
            <Button
              variant="secondary"
              leftIcon="Check"
              onClick={handleComplete}
              isLoading={completeMutation.isPending}
            >
              {ORDERS_LIST_LABELS.BTN_COMPLETE}
            </Button>
          )}
          {order.status !== 'cancelled' && (
            <Button
              variant="secondary"
              leftIcon="FileText"
              onClick={() => onCreateContract(order)}
            >
              {ORDERS_LIST_LABELS.BTN_CONTRACT}
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
              {ORDERS_LIST_LABELS.BTN_CANCEL}
            </Button>
          )}
        </div>

        {actionError && (
          <p className="error-inline text-sm">
            {ORDERS_FORM_LABELS.ERROR_PREFIX}{' '}
            {actionError instanceof Error
              ? actionError.message
              : String(actionError)}
          </p>
        )}
      </div>

      {/* Order items table */}
      <div className="px-5 pb-5">
        <h4 className="mb-3">
          {ORDERS_FORM_LABELS.SECTION_ITEMS} ({items.length})
        </h4>
        <div className="data-table-wrap">
          {items.length === 0 ? (
            <p className="table-empty">{ORDERS_LIST_LABELS.EMPTY_ITEMS}</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  {order.order_type === 'trading' && (
                    <th>{ORDERS_LIST_LABELS.COL_SOURCE}</th>
                  )}
                  <th>{ORDERS_LIST_LABELS.TYPE_FABRIC}</th>
                  <th>{ORDERS_FORM_LABELS.FIELD_COLOR}</th>
                  <th className="text-right">
                    {ORDERS_FORM_LABELS.FIELD_QUANTITY}
                  </th>
                  <th className="text-right">{ORDERS_LIST_LABELS.COL_PRICE}</th>
                  <th className="text-right">
                    {ORDERS_LIST_LABELS.COL_AMOUNT}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item, idx) => {
                    const category = (item as Record<string, unknown>)
                      .product_category as ProductCategory | undefined;
                    return (
                      <tr key={item.id}>
                        <td className="text-muted-foreground text-sm">
                          {idx + 1}
                        </td>
                        {order.order_type === 'trading' && (
                          <td>
                            <Badge variant="info">
                              {category
                                ? PRODUCT_CATEGORY_LABELS[category]
                                : ORDERS_LIST_LABELS.TYPE_FABRIC}
                            </Badge>
                          </td>
                        )}
                        <td>
                          <strong>{item.fabric_type}</strong>
                        </td>
                        <td className="text-muted-foreground text-sm">
                          {item.color_name ?? '\u2014'}
                        </td>
                        <td className="text-right tabular-nums">
                          <QuantityText
                            value={item.quantity}
                            suffix={item.unit}
                            decimals={2}
                          />
                        </td>
                        <td className="text-right tabular-nums">
                          <MoneyText value={item.unit_price} suffix="đ" />
                        </td>
                        <td className="text-right tabular-nums font-bold">
                          <MoneyText value={item.amount ?? 0} suffix="đ" />
                        </td>
                      </tr>
                    );
                  })}
                <tr>
                  <td
                    colSpan={order.order_type === 'trading' ? 6 : 5}
                    className="text-right font-bold"
                  >
                    {ORDERS_FORM_LABELS.TXT_TOTAL}
                  </td>
                  <td className="text-right tabular-nums font-bold">
                    <MoneyText value={order.total_amount} suffix="đ" />
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
          <h4 className="mb-3">{ORDERS_PROG_LABELS.PROG_TIMELINE_TITLE}</h4>
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

      {/* Chat Widget */}
      <ChatWidget
        entityType="order"
        entityId={orderId}
        title={order.order_number}
        subtitle={`${ORDERS_LIST_LABELS.PAGE_TITLE} ${ORDER_TYPE_LABELS[order.order_type as keyof typeof ORDER_TYPE_LABELS]}`}
      />
    </div>
  );
}
