import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { withSuspense } from '@/app/router/routeWrappers';
import { CustomerPortalLayout } from '@/features/customer-portal/CustomerPortalLayout';
import { PortalRoute } from '@/features/customer-portal/PortalRoute';

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

const portalFallback = (
  <div className="p-4 text-sm text-slate-500">Đang tải…</div>
);

export const portalRoutes: RouteObject[] = [
  {
    path: '/portal',
    element: <PortalRoute />,
    children: [
      {
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
        ],
      },
    ],
  },
];
