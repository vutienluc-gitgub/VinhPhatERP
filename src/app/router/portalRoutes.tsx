import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { withSuspense } from '@/app/router/routeWrappers';
import { CustomerPortalLayout } from '@/features/customer-portal/CustomerPortalLayout';
import { PortalRoute } from '@/features/customer-portal/PortalRoute';
import { SupplierPortalLayout } from '@/features/supplier-portal/SupplierPortalLayout';
import { SupplierPOListPage } from '@/features/supplier-portal/SupplierPOListPage';
import { SupplierPODetailPage } from '@/features/supplier-portal/SupplierPODetailPage';
import { SupplierRFQListPage } from '@/features/supplier-portal/SupplierRFQListPage';
import { SupplierRFQDetailPage } from '@/features/supplier-portal/SupplierRFQDetailPage';
import { SupplierInvoicesPage } from '@/features/supplier-portal/SupplierInvoicesPage';
import { SupplierDebtPage } from '@/features/supplier-portal/SupplierDebtPage';
import { SupplierProfilePage } from '@/features/supplier-portal/SupplierProfilePage';

// --- Work Orders ---
const SupplierWorkOrderListPage = lazy(() =>
  import('@/features/supplier-portal/work-orders/SupplierWorkOrderListPage').then(
    (m) => ({ default: m.SupplierWorkOrderListPage }),
  ),
);
const WorkOrderWorkspace = lazy(() =>
  import('@/features/supplier-portal/work-orders/components/WorkOrderWorkspace').then(
    (m) => ({ default: m.WorkOrderWorkspace }),
  ),
);
const OverviewDomain = lazy(() =>
  import('@/features/supplier-portal/work-orders/components/Domains').then(
    (m) => ({ default: m.OverviewDomain }),
  ),
);
const ProductionDomain = lazy(() =>
  import('@/features/supplier-portal/work-orders/components/Domains').then(
    (m) => ({ default: m.ProductionDomain }),
  ),
);
const MaterialDomain = lazy(() =>
  import('@/features/supplier-portal/work-orders/components/Domains').then(
    (m) => ({ default: m.MaterialDomain }),
  ),
);
const QualityDomain = lazy(() =>
  import('@/features/supplier-portal/work-orders/components/Domains').then(
    (m) => ({ default: m.QualityDomain }),
  ),
);
const DocumentsDomain = lazy(() =>
  import('@/features/supplier-portal/work-orders/components/Domains').then(
    (m) => ({ default: m.DocumentsDomain }),
  ),
);
const TimelineDomain = lazy(() =>
  import('@/features/supplier-portal/work-orders/components/Domains').then(
    (m) => ({ default: m.TimelineDomain }),
  ),
);

const PortalDashboardPage = lazy(() =>
  import('@/features/customer-portal/dashboard/PortalDashboardPage').then(
    (m) => ({ default: m.PortalDashboardPage }),
  ),
);
const SupplierDashboardPage = lazy(() =>
  import('@/features/supplier-portal/dashboard/SupplierDashboardPage').then(
    (m) => ({ default: m.SupplierDashboardPage }),
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

const portalFallback = <div className="p-4 text-sm text-muted">Đang tải…</div>;

export const portalRoutes: RouteObject[] = [
  {
    path: '/portal',
    element: <PortalRoute />,
    children: [
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
        ],
      },
      {
        path: 'supplier',
        element: <SupplierPortalLayout />,
        children: [
          {
            index: true,
            element: withSuspense(<SupplierDashboardPage />, portalFallback),
          },
          {
            path: 'orders',
            element: <SupplierPOListPage />,
          },
          {
            path: 'orders/:id',
            element: <SupplierPODetailPage />,
          },
          {
            path: 'quotations',
            element: <SupplierRFQListPage />,
          },
          {
            path: 'quotations/:id',
            element: <SupplierRFQDetailPage />,
          },
          {
            path: 'invoices',
            element: <SupplierInvoicesPage />,
          },
          {
            path: 'debt',
            element: <SupplierDebtPage />,
          },
          {
            path: 'deliveries',
            element: (
              <div className="p-4">Danh sách Giao hàng - Đang xây dựng</div>
            ),
          },
          {
            path: 'work-orders',
            element: withSuspense(
              <SupplierWorkOrderListPage />,
              portalFallback,
            ),
          },
          {
            path: 'work-orders/:id',
            element: withSuspense(<WorkOrderWorkspace />, portalFallback),
            children: [
              {
                path: 'overview',
                element: withSuspense(<OverviewDomain />, portalFallback),
              },
              {
                path: 'production',
                element: withSuspense(<ProductionDomain />, portalFallback),
              },
              {
                path: 'materials',
                element: withSuspense(<MaterialDomain />, portalFallback),
              },
              {
                path: 'quality',
                element: withSuspense(<QualityDomain />, portalFallback),
              },
              {
                path: 'documents',
                element: withSuspense(<DocumentsDomain />, portalFallback),
              },
              {
                path: 'timeline',
                element: withSuspense(<TimelineDomain />, portalFallback),
              },
            ],
          },
          {
            path: 'profile',
            element: <SupplierProfilePage />,
          },
        ],
      },
    ],
  },
];
