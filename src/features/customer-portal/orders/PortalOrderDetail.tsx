import React from 'react';
import { useParams, Link } from 'react-router-dom';

import { usePortalOrders } from '@/application/crm/portal';
import { MoneyText } from '@/shared/value';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
} from '@/features/customer-portal/constants';

import { PortalOrderPaymentSection } from './PortalOrderPaymentSection';
import { PortalOrderPackingList } from './PortalOrderPackingList';
import { PortalProgressTimeline } from './PortalProgressTimeline';
import { PORTAL_ORDER_DETAIL_TEXT } from './orders.constants';

export const PortalOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { order, stages, rolls, paymentSummary, loading, error } =
    usePortalOrders(id);

  if (loading) {
    return <p className="portal-loading">{PORTAL_ORDER_DETAIL_TEXT.LOADING}</p>;
  }

  if (error) {
    return <p className="portal-error">{error}</p>;
  }

  if (!order) {
    return <p className="portal-empty">{PORTAL_ORDER_DETAIL_TEXT.NOT_FOUND}</p>;
  }

  const statusBadgeClass = ORDER_STATUS_BADGE[order.status] ?? 'portal-badge';
  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;

  return (
    <div
      className="portal-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Breadcrumb */}
      <div className="portal-breadcrumb">
        <Link to="/portal/orders">
          ← {PORTAL_ORDER_DETAIL_TEXT.BREADCRUMB_ORDERS}
        </Link>
        <span>/</span>
        <span>{order.order_number}</span>
      </div>

      {/* Header Info Card */}
      <div className="portal-table-wrap">
        <div className="portal-card-header">
          <span style={{ fontWeight: 700 }}>{order.order_number}</span>
          <span className={statusBadgeClass}>{statusLabel}</span>
        </div>
        <div className="portal-card-body">
          <div className="portal-detail-grid">
            <div className="portal-detail-item">
              <label>{PORTAL_ORDER_DETAIL_TEXT.ORDER_DATE}</label>
              <p>{order.order_date}</p>
            </div>
            <div className="portal-detail-item">
              <label>{PORTAL_ORDER_DETAIL_TEXT.DELIVERY_DATE}</label>
              <p>{order.due_date ?? '—'}</p>
            </div>
            <div className="portal-detail-item">
              <label>{PORTAL_ORDER_DETAIL_TEXT.TOTAL_AMOUNT}</label>
              <p style={{ fontWeight: 600 }}>
                <MoneyText value={order.total_amount} />
              </p>
            </div>
            <div className="portal-detail-item">
              <label>{PORTAL_ORDER_DETAIL_TEXT.PAID_AMOUNT}</label>
              <p>
                <MoneyText value={order.paid_amount} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary & VietQR Quick Pay */}
      {paymentSummary && (
        <PortalOrderPaymentSection
          paymentSummary={paymentSummary}
          orderNumber={order.order_number}
        />
      )}

      {/* Packing List Breakdown (Rolls) */}
      {rolls && rolls.length > 0 && <PortalOrderPackingList rolls={rolls} />}

      {/* Products Table */}
      {order.items && order.items.length > 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">
            <span>{PORTAL_ORDER_DETAIL_TEXT.PRODUCTS_TITLE}</span>
            <span className="portal-badge">{order.items.length} mặt hàng</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{PORTAL_ORDER_DETAIL_TEXT.COL_FABRIC}</th>
                  <th>{PORTAL_ORDER_DETAIL_TEXT.COL_COLOR}</th>
                  <th className="right">
                    {PORTAL_ORDER_DETAIL_TEXT.COL_QUANTITY}
                  </th>
                  <th className="right">
                    {PORTAL_ORDER_DETAIL_TEXT.COL_UNIT_PRICE}
                  </th>
                  <th className="right">
                    {PORTAL_ORDER_DETAIL_TEXT.COL_AMOUNT}
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.fabric_name}</td>
                    <td>{item.color ?? '—'}</td>
                    <td className="right">{item.quantity}</td>
                    <td className="right">
                      <MoneyText value={item.unit_price} />
                    </td>
                    <td className="right" style={{ fontWeight: 600 }}>
                      <MoneyText value={item.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Production Timeline */}
      <div className="portal-table-wrap">
        <div className="portal-card-header">
          <span>{PORTAL_ORDER_DETAIL_TEXT.PROGRESS_TITLE}</span>
        </div>
        <div className="portal-card-body">
          <PortalProgressTimeline
            stages={stages}
            orderNumber={order.order_number}
          />
        </div>
      </div>
    </div>
  );
};
