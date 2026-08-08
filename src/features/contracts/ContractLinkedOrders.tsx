import { Button, Icon } from '@/shared/components';

import { formatContractDate } from './contracts.utils';
import { CONTRACT_MESSAGES as MSG } from './contracts.constants';

// ── Types ────────────────────────────────────────────────────────────────────

type LinkedOrder = {
  id: string;
  order_number: string;
  status: string;
  linked_at: string;
};

type ContractLinkedOrdersProps = {
  orders: LinkedOrder[];
  isLoading: boolean;
  canLinkOrder: boolean;
  onUnlink: (orderId: string, orderNumber: string) => void;
  isUnlinking: boolean;
};

// ── Component ────────────────────────────────────────────────────────────────

export function ContractLinkedOrders({
  orders,
  isLoading,
  canLinkOrder,
  onUnlink,
  isUnlinking,
}: ContractLinkedOrdersProps) {
  return (
    <div className="px-5 pb-5">
      <h4 className="mb-3 flex items-center gap-2">
        <Icon name="Link" size={16} />
        {MSG.TITLE_LINKED_ORDERS(orders.length)}
      </h4>
      {isLoading ? (
        <p className="table-empty text-sm">{MSG.MSG_LOADING}</p>
      ) : orders.length === 0 ? (
        <p className="table-empty text-sm">{MSG.MSG_NO_LINKED_ORDERS}</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{MSG.COL_ORDER_NUMBER}</th>
                <th>{MSG.COL_ORDER_STATUS}</th>
                <th>{MSG.COL_LINK_DATE}</th>
                {canLinkOrder && (
                  <th className="text-right">{MSG.COL_ACTIONS}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono font-medium">
                    {order.order_number}
                  </td>
                  <td>
                    <span className="badge-outline text-xs">
                      {order.status}
                    </span>
                  </td>
                  <td className="text-muted-foreground text-sm text-sm">
                    {formatContractDate(order.linked_at)}
                  </td>
                  {canLinkOrder && (
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon="Unlink"
                        onClick={() => onUnlink(order.id, order.order_number)}
                        isLoading={isUnlinking}
                        className="text-danger"
                      >
                        Huy lien ket
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
