import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { BlockedPage, ProfilePage, UnauthorizedPage } from '@/features/auth';
import { AppShell } from '@/app/layouts/AppShell';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { PortalRoute } from '@/features/customer-portal/PortalRoute';
import { CustomerPortalLayout } from '@/features/customer-portal/CustomerPortalLayout';
import {
  appRoutes,
  adminRoutes,
  authRoute,
  managerRoutes,
  printRoutes,
} from '@/app/router/routes';

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
    (m) => ({ default: m.PortalPaymentsPage }),
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

function PortalPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<div className="p-4 text-sm text-gray-500">Đang tải…</div>}
    >
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  // ---- Public routes ----
  {
    path: '/auth',
    element: authRoute.element,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/blocked',
    element: <BlockedPage />,
  },

  // ---- Customer Portal ----
  {
    path: '/portal',
    element: <PortalRoute />,
    children: [
      {
        element: <CustomerPortalLayout />,
        children: [
          {
            index: true,
            element: (
              <PortalPage>
                <PortalDashboardPage />
              </PortalPage>
            ),
          },
          {
            path: 'orders',
            element: (
              <PortalPage>
                <PortalOrdersPage />
              </PortalPage>
            ),
          },
          {
            path: 'orders/:id',
            element: (
              <PortalPage>
                <PortalOrderDetail />
              </PortalPage>
            ),
          },
          {
            path: 'debt',
            element: (
              <PortalPage>
                <PortalDebtPage />
              </PortalPage>
            ),
          },
          {
            path: 'payments',
            element: (
              <PortalPage>
                <PortalPaymentsPage />
              </PortalPage>
            ),
          },
          {
            path: 'shipments',
            element: (
              <PortalPage>
                <PortalShipmentsPage />
              </PortalPage>
            ),
          },
          {
            path: 'shipments/:id',
            element: (
              <PortalPage>
                <PortalShipmentDetail />
              </PortalPage>
            ),
          },
        ],
      },
    ],
  },

  // ---- Protected ERP shell ----
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      ...printRoutes,
      {
        element: <AppShell />,
        children: [
          ...appRoutes,
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            element: <ProtectedRoute allowedRoles={['admin', 'manager']} />,
            children: managerRoutes,
          },
          {
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: adminRoutes,
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
