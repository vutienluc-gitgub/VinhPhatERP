import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

import { withSuspense } from '@/app/router/routeWrappers';
import { CustomerPortalLayout } from '@/features/customer-portal/CustomerPortalLayout';
import { PortalRoute } from '@/features/customer-portal/PortalRoute';

import {
  PortalOrderIdRedirect,
  PortalQuotationIdRedirect,
  PortalShipmentIdRedirect,
} from './resolvers/PortalRedirectResolvers';
import { supplierPortalRoute } from './supplierRoutes';

const PortalDashboardPage = lazy(() =>
  import('@/features/customer-portal/dashboard/PortalDashboardPage').then(
    (m) => ({ default: m.PortalDashboardPage }),
  ),
);

const PortalOrdersPage = lazy(() =>
  import('@/features/customer-portal/orders/PortalOrdersPage').then((m) => ({
    default: m.PortalOrdersPage,
  })),
);
const PortalOrderDetail = lazy(() =>
  import('@/features/customer-portal/orders/PortalOrderDetail').then((m) => ({
    default: m.PortalOrderDetail,
  })),
);
const PortalDebtPage = lazy(() =>
  import('@/features/customer-portal/debt/PortalDebtPage').then((m) => ({
    default: m.PortalDebtPage,
  })),
);
const PortalPaymentsPage = lazy(() =>
  import('@/features/customer-portal/payments/PortalPaymentsPage').then(
    (m) => ({
      default: m.PortalPaymentsPage,
    }),
  ),
);
const PortalShipmentsPage = lazy(() =>
  import('@/features/customer-portal/shipments/PortalShipmentsPage').then(
    (m) => ({ default: m.PortalShipmentsPage }),
  ),
);
const PortalShipmentDetail = lazy(() =>
  import('@/features/customer-portal/shipments/PortalShipmentDetail').then(
    (m) => ({ default: m.PortalShipmentDetail }),
  ),
);
const PortalFabricCatalogPage = lazy(() =>
  import('@/features/customer-portal/fabric-catalog/PortalFabricCatalogPage').then(
    (m) => ({ default: m.PortalFabricCatalogPage }),
  ),
);
const PortalQuotationsPage = lazy(() =>
  import('@/features/customer-portal/quotations/PortalQuotationsPage').then(
    (m) => ({ default: m.PortalQuotationsPage }),
  ),
);
const PortalQuotationDetail = lazy(() =>
  import('@/features/customer-portal/quotations/PortalQuotationDetail').then(
    (m) => ({ default: m.PortalQuotationDetail }),
  ),
);

const portalFallback = (
  <div className="p-4 text-sm text-muted-foreground">Đang tải…</div>
);

export const portalRoutes: RouteObject[] = [
  {
    path: '/portal',
    element: <PortalRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/portal/customer" replace />,
      },
      // Convenience/Backward-compatibility aliases for direct /portal/... URLs
      {
        path: 'orders',
        element: <Navigate to="/portal/customer/orders" replace />,
      },
      {
        path: 'orders/:id',
        element: <PortalOrderIdRedirect />,
      },
      {
        path: 'debt',
        element: <Navigate to="/portal/customer/debt" replace />,
      },
      {
        path: 'payments',
        element: <Navigate to="/portal/customer/payments" replace />,
      },
      {
        path: 'shipments',
        element: <Navigate to="/portal/customer/shipments" replace />,
      },
      {
        path: 'shipments/:id',
        element: <PortalShipmentIdRedirect />,
      },
      {
        path: 'fabric-catalog',
        element: <Navigate to="/portal/customer/fabric-catalog" replace />,
      },
      {
        path: 'quotations',
        element: <Navigate to="/portal/customer/quotations" replace />,
      },
      {
        path: 'quotations/:id',
        element: <PortalQuotationIdRedirect />,
      },
      {
        path: 'customer',
        element: <CustomerPortalLayout />,
        children: [
          {
            index: true,
            element: withSuspense(<PortalDashboardPage />, portalFallback),
          },
          {
            path: 'orders',
            element: withSuspense(<PortalOrdersPage />, portalFallback),
          },
          {
            path: 'orders/:id',
            element: withSuspense(<PortalOrderDetail />, portalFallback),
          },
          {
            path: 'debt',
            element: withSuspense(<PortalDebtPage />, portalFallback),
          },
          {
            path: 'payments',
            element: withSuspense(<PortalPaymentsPage />, portalFallback),
          },
          {
            path: 'shipments',
            element: withSuspense(<PortalShipmentsPage />, portalFallback),
          },
          {
            path: 'shipments/:id',
            element: withSuspense(<PortalShipmentDetail />, portalFallback),
          },
          {
            path: 'fabric-catalog',
            element: withSuspense(<PortalFabricCatalogPage />, portalFallback),
          },
          {
            path: 'quotations',
            element: withSuspense(<PortalQuotationsPage />, portalFallback),
          },
          {
            path: 'quotations/:id',
            element: withSuspense(<PortalQuotationDetail />, portalFallback),
          },
        ],
      },
      supplierPortalRoute,
    ],
  },
];
