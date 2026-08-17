import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { useGlobalModal } from '@/shared/hooks/useGlobalModal';
import { ContractForm } from '@/features/contracts/ContractForm';
import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';
import { PageLayout } from '@/shared/components';
import type { Order } from '@/domain/orders/types';

import { OrderDetail } from './OrderDetail';
import { OrderForm } from './OrderForm';
import { OrderList } from './OrderList';
import { ReserveRollsPanel } from './ReserveRollsPanel';
import { ORDERS_LIST_LABELS } from './orders.constants';

type View = { mode: 'list' } | { mode: 'detail'; orderId: string };

export function OrdersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const view: View = id ? { mode: 'detail', orderId: id } : { mode: 'list' };
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reserveOrder, setReserveOrder] = useState<Order | null>(null);
  const [contractOrder, setContractOrder] = useState<Order | null>(null);
  const { openModal } = useGlobalModal();

  const { activeGuides } = useContextualGuide(
    'Orders',
    view.mode === 'detail' ? view.orderId : undefined,
    view.mode,
  );

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
    <div className="page-container">
      <PageLayout className="flex-1 h-full">
        {view.mode === 'list' ? (
          <OrderList
            onNew={openCreate}
            onEdit={(order) => {
              if (order.status === 'draft') openEdit(order);
              else navigate(`/orders/${order.id}`);
            }}
            onView={(order) => navigate(`/orders/${order.id}`)}
          />
        ) : (
          <OrderDetail
            orderId={view.orderId}
            onBack={() => navigate('/orders')}
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
            onCreateContract={(order) => setContractOrder(order)}
          />
        )}
      </PageLayout>

      {/* Order Form */}
      {showForm && (
        <OrderForm
          key={editOrder?.id ?? 'new'}
          order={editOrder ? editOrder : null}
          onClose={closeForm}
        />
      )}

      {/* Reserve rolls panel */}
      {reserveOrder && (
        <ReserveRollsPanel
          order={reserveOrder}
          onClose={() => setReserveOrder(null)}
        />
      )}

      {/* Contract creation sheet */}
      <AdaptiveSheet
        open={!!contractOrder}
        onClose={() => setContractOrder(null)}
        title={ORDERS_LIST_LABELS.BTN_CONTRACT}
      >
        {contractOrder && (
          <ContractForm
            defaultSourceType="order"
            defaultSourceId={contractOrder.id}
            defaultSourceName={contractOrder.order_number}
            onSuccess={() => {
              setContractOrder(null);
            }}
            onCancel={() => setContractOrder(null)}
          />
        )}
      </AdaptiveSheet>

      {/* Guide System Integration */}
      <ContextualGuide activeGuides={activeGuides} />
    </div>
  );
}
