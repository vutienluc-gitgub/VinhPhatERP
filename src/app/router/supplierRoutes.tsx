import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { withSuspense } from '@/app/router/routeWrappers';
import { SupplierPortalLayout } from '@/features/supplier-portal/SupplierPortalLayout';
import { SupplierPOListPage } from '@/features/supplier-portal/SupplierPOListPage';
import { SupplierPODetailPage } from '@/features/supplier-portal/SupplierPODetailPage';
import { SupplierRFQListPage } from '@/features/supplier-portal/SupplierRFQListPage';
import { SupplierRFQDetailPage } from '@/features/supplier-portal/SupplierRFQDetailPage';
import { SupplierInvoicesPage } from '@/features/supplier-portal/SupplierInvoicesPage';
import { SupplierDebtPage } from '@/features/supplier-portal/SupplierDebtPage';
import { SupplierProfilePage } from '@/features/supplier-portal/SupplierProfilePage';
import { SupplierEntitlementGuard } from '@/features/supplier-portal/components/SupplierEntitlementGuard';

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

const SupplierDashboardPage = lazy(() =>
  import('@/features/supplier-portal/dashboard/SupplierDashboardPage').then(
    (m) => ({ default: m.SupplierDashboardPage }),
  ),
);

const supplierFallback = (
  <div className="p-4 text-sm text-muted-foreground">Đang tải…</div>
);

export const supplierPortalRoute: RouteObject = {
  path: 'supplier',
  element: <SupplierPortalLayout />,
  children: [
    {
      index: true,
      element: withSuspense(<SupplierDashboardPage />, supplierFallback),
    },
    {
      path: 'orders',
      element: (
        <SupplierEntitlementGuard requiredEntitlement="VIEW_PO">
          <SupplierPOListPage />
        </SupplierEntitlementGuard>
      ),
    },
    {
      path: 'orders/:id',
      element: (
        <SupplierEntitlementGuard requiredEntitlement="VIEW_PO">
          <SupplierPODetailPage />
        </SupplierEntitlementGuard>
      ),
    },
    {
      path: 'quotations',
      element: (
        <SupplierEntitlementGuard requiredEntitlement="VIEW_RFQ">
          <SupplierRFQListPage />
        </SupplierEntitlementGuard>
      ),
    },
    {
      path: 'quotations/:id',
      element: (
        <SupplierEntitlementGuard requiredEntitlement="VIEW_RFQ">
          <SupplierRFQDetailPage />
        </SupplierEntitlementGuard>
      ),
    },
    {
      path: 'invoices',
      element: (
        <SupplierEntitlementGuard requiredEntitlement="SUBMIT_INVOICE">
          <SupplierInvoicesPage />
        </SupplierEntitlementGuard>
      ),
    },
    {
      path: 'debt',
      element: (
        <SupplierEntitlementGuard requiredEntitlement="VIEW_DEBT">
          <SupplierDebtPage />
        </SupplierEntitlementGuard>
      ),
    },
    {
      path: 'deliveries',
      element: (
        <SupplierEntitlementGuard requiredEntitlement="CONFIRM_DELIVERY">
          <div className="p-4">Danh sách Giao hàng - Đang xây dựng</div>
        </SupplierEntitlementGuard>
      ),
    },
    {
      path: 'work-orders',
      element: (
        <SupplierEntitlementGuard requiredEntitlement="VIEW_WORK_ORDER">
          {withSuspense(<SupplierWorkOrderListPage />, supplierFallback)}
        </SupplierEntitlementGuard>
      ),
    },
    {
      path: 'work-orders/:id',
      element: (
        <SupplierEntitlementGuard requiredEntitlement="VIEW_WORK_ORDER">
          {withSuspense(<WorkOrderWorkspace />, supplierFallback)}
        </SupplierEntitlementGuard>
      ),
      children: [
        {
          path: 'overview',
          element: withSuspense(<OverviewDomain />, supplierFallback),
        },
        {
          path: 'production',
          element: withSuspense(<ProductionDomain />, supplierFallback),
        },
        {
          path: 'materials',
          element: withSuspense(<MaterialDomain />, supplierFallback),
        },
        {
          path: 'quality',
          element: withSuspense(<QualityDomain />, supplierFallback),
        },
        {
          path: 'documents',
          element: withSuspense(<DocumentsDomain />, supplierFallback),
        },
        {
          path: 'timeline',
          element: withSuspense(<TimelineDomain />, supplierFallback),
        },
      ],
    },
    {
      path: 'profile',
      element: <SupplierProfilePage />,
    },
  ],
};
