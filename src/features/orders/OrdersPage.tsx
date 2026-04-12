import { useCallback, useState } from 'react';

import { useGlobalModal } from '@/shared/hooks/useGlobalModal';

import { OrderDetail } from './OrderDetail';
import { OrderForm } from './OrderForm';
import { OrderList } from './OrderList';
import { ReserveRollsPanel } from './ReserveRollsPanel';
import type { Order } from './types';

type View = { mode: 'list' } | { mode: 'detail'; orderId: string };

export function OrdersPage() {
  const [view, setView] = useState<View>({ mode: 'list' });
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reserveOrder, setReserveOrder] = useState<Order | null>(null);
  const { openModal } = useGlobalModal();

  const openCreate = useCallback(() => {
    setEditOrder(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((order: Order) => {
    setEditOrder(order);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditOrder(null);
  }, []);

  return (
    <>
      {view.mode === 'list' ? (
        <OrderList
          onNew={openCreate}
          onEdit={(order) => {
            if (order.status === 'draft') openEdit(order);
            else
              setView({
                mode: 'detail',
                orderId: order.id,
              });
          }}
          onView={(order) =>
            setView({
              mode: 'detail',
              orderId: order.id,
            })
          }
        />
      ) : (
        <OrderDetail
          orderId={view.orderId}
          onBack={() => setView({ mode: 'list' })}
          onEdit={(order) => {
            openEdit(order);
          }}
          onCreateShipment={(order) =>
            openModal('SHIPMENT_FORM', {
              orderId: order.id,
              customerId: order.customer_id,
              orderNumber: order.order_number,
            })
          }
          onCreatePayment={(order) =>
            openModal('PAYMENT_FORM', {
              orderId: order.id,
              customerId: order.customer_id,
              orderNumber: order.order_number,
              balanceDue: order.total_amount - order.paid_amount,
            })
          }
          onReserveRolls={(order) => setReserveOrder(order)}
        />
      )}

      {/* Order Form Modal */}
      {showForm && (
        <OrderForm order={editOrder ? editOrder : null} onClose={closeForm} />
      )}

      {/* Reserve rolls panel */}
      {reserveOrder && (
        <ReserveRollsPanel
          order={reserveOrder}
          onClose={() => setReserveOrder(null)}
        />
      )}
    </>
  );
}
