import { Button, Icon } from '@/shared/components';

import { formatContractDate } from './contracts.utils';

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
        Đơn hàng liên kết ({orders.length})
      </h4>
      {isLoading ? (
        <p className="table-empty text-sm">Đang tải...</p>
      ) : orders.length === 0 ? (
        <p className="table-empty text-sm">
          Chưa có đơn hàng nào được liên kết.
        </p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Số đơn hàng</th>
                <th>Trạng thái</th>
                <th>Ngày liên kết</th>
                {canLinkOrder && <th className="text-right">Thao tác</th>}
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
                  <td className="text-muted text-sm text-sm">
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
