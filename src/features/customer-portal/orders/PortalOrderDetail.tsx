import React from 'react';
import { useParams, Link } from 'react-router-dom';

import { usePortalOrders } from '@/application/crm/portal';
import { MoneyText } from '@/shared/value';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
} from '@/features/customer-portal/constants';
import { TableSkeleton, ErrorInline, EmptyState } from '@/shared/components';

import { PortalOrderPaymentSection } from './PortalOrderPaymentSection';
import { PortalOrderPackingList } from './PortalOrderPackingList';
import { PortalProgressTimeline } from './PortalProgressTimeline';
import { PORTAL_ORDER_DETAIL_TEXT } from './orders.constants';

export const PortalOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { order, stages, rolls, paymentSummary, loading, error } =
    usePortalOrders(id);

  if (loading) {
    return (
      <div className="portal-section space-y-4">
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-section">
        <ErrorInline>{error}</ErrorInline>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="portal-section">
        <EmptyState
          icon="PackageX"
          description={PORTAL_ORDER_DETAIL_TEXT.NOT_FOUND}
        />
      </div>
    );
  }

  const statusBadgeClass = ORDER_STATUS_BADGE[order.status] ?? 'portal-badge';
  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;

  return (
    <div className="portal-section flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="portal-breadcrumb">
        <Link to="/portal/customer/orders">
          ← {PORTAL_ORDER_DETAIL_TEXT.BREADCRUMB_ORDERS}
        </Link>
        <span>/</span>
        <span>{order.order_number}</span>
      </div>

      {/* Header Info Card */}
      <div className="portal-table-wrap">
        <div className="portal-card-header">
          <span className="font-bold">{order.order_number}</span>
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
              <p className="font-semibold">
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
          <div className="overflow-x-auto">
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
                    <td className="font-semibold">{item.fabric_name}</td>
                    <td>{item.color ?? '—'}</td>
                    <td className="right">{item.quantity}</td>
                    <td className="right">
                      <MoneyText value={item.unit_price} />
                    </td>
                    <td className="right font-semibold">
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
