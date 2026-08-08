import { Badge } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_VARIANTS,
} from '@/schema/order.schema';
import type { Order } from '@/features/orders/types';
import {
  daysUntilDelivery,
  calculateBalanceDue,
} from '@/features/orders/utils';
import { ORDERS_FORM_LABELS } from '@/features/orders/orders.constants';

type OrderMobileCardProps = {
  order: Order;
};

export function OrderMobileCard({ order }: OrderMobileCardProps) {
  const due = daysUntilDelivery(order.delivery_date);
  const balanceDue = calculateBalanceDue(order);
  return (
    <div className="mobile-card">
      <div className="mobile-card-header border-b border-border/10 pb-2 mb-2">
        <span className="font-bold text-foreground">{order.order_number}</span>
        <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.status] ?? 'gray'}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>
      <div className="mobile-card-body space-y-2">
        <div className="flex justify-between items-start gap-2">
          <span className="text-sm font-bold break-words min-w-0 flex-1">
            {order.customers?.name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0 text-right">
            {order.order_date}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">
              {ORDERS_FORM_LABELS.LBL_TOTAL_AMOUNT}
            </span>
            <MoneyText
              value={order.total_amount}
              className="text-sm font-medium"
              suffix="đ"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">
              {ORDERS_FORM_LABELS.LBL_BALANCE_DUE}
            </span>
            <MoneyText
              value={balanceDue}
              className={`text-sm font-bold ${balanceDue > 0 ? 'text-danger' : 'text-success'}`}
              suffix="đ"
            />
          </div>
        </div>
        {due && (
          <div
            className={`mt-2 p-1.5 rounded text-[10px] font-bold text-center uppercase ${due.urgent ? 'bg-danger/10 text-danger' : 'bg-surface-subtle text-muted-foreground'}`}
          >
            {ORDERS_FORM_LABELS.LBL_DELIVERY}
            {due.text} ({order.delivery_date})
          </div>
        )}
      </div>
    </div>
  );
}
