import { useState } from 'react'

import { ShipmentForm } from '@/features/shipments/ShipmentForm'
import { PaymentForm } from '@/features/payments/PaymentForm'
import { OrderDetail } from './OrderDetail'
import { OrderForm } from './OrderForm'
import { OrderList } from './OrderList'
import type { Order } from './types'

type View = { mode: 'list' } | { mode: 'detail'; orderId: string }

export function OrdersPage() {
  const [view, setView] = useState<View>({ mode: 'list' })
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [shipmentOrder, setShipmentOrder] = useState<Order | null>(null)
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null)

  function openCreate() {
    setEditOrder(null)
    setShowForm(true)
  }

  function openEdit(order: Order) {
    setEditOrder(order)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditOrder(null)
  }

  return (
    <>
      {view.mode === 'list' ? (
        <OrderList
          onNew={openCreate}
          onEdit={(order) => {
            if (order.status === 'draft') openEdit(order)
            else setView({ mode: 'detail', orderId: order.id })
          }}
          onView={(order) => setView({ mode: 'detail', orderId: order.id })}
        />
      ) : (
        <OrderDetail
          orderId={view.orderId}
          onBack={() => setView({ mode: 'list' })}
          onEdit={(order) => {
            openEdit(order)
          }}
          onCreateShipment={(order) => setShipmentOrder(order)}
          onCreatePayment={(order) => setPaymentOrder(order)}
        />
      )}

      {showForm && (
        <OrderForm
          order={
            editOrder
              ? editOrder
              : null
          }
          onClose={closeForm}
        />
      )}

      {/* Shipment form modal */}
      {shipmentOrder && (
        <ShipmentForm
          orderId={shipmentOrder.id}
          customerId={shipmentOrder.customer_id}
          orderNumber={shipmentOrder.order_number}
          onClose={() => setShipmentOrder(null)}
        />
      )}

      {/* Payment form modal */}
      {paymentOrder && (
        <PaymentForm
          orderId={paymentOrder.id}
          customerId={paymentOrder.customer_id}
          orderNumber={paymentOrder.order_number}
          balanceDue={paymentOrder.total_amount - paymentOrder.paid_amount}
          onClose={() => setPaymentOrder(null)}
        />
      )}
    </>
  )
}