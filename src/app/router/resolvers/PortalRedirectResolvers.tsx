import { Navigate, useParams } from 'react-router-dom';

/**
 * Redirects legacy or flat order deep links (/portal/orders/:id)
 * to canonical customer order route (/portal/customer/orders/:id).
 */
export function PortalOrderIdRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/portal/customer/orders/${id ?? ''}`} replace />;
}

/**
 * Redirects legacy or flat shipment deep links (/portal/shipments/:id)
 * to canonical customer shipment route (/portal/customer/shipments/:id).
 */
export function PortalShipmentIdRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/portal/customer/shipments/${id ?? ''}`} replace />;
}

/**
 * Redirects legacy or flat quotation deep links (/portal/quotations/:id)
 * to canonical customer quotation route (/portal/customer/quotations/:id).
 */
export function PortalQuotationIdRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/portal/customer/quotations/${id ?? ''}`} replace />;
}
