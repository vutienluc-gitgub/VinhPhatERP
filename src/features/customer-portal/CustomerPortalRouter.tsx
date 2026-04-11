import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { CustomerPortalLayout } from './CustomerPortalLayout';

const PortalDashboardPage = lazy(() =>
  import('./dashboard/PortalDashboardPage').then((m) => ({
    default: m.PortalDashboardPage,
  })),
);
const PortalOrdersPage = lazy(() =>
  import('./orders/PortalOrdersPage').then((m) => ({
    default: m.PortalOrdersPage,
  })),
);
const PortalOrderDetail = lazy(() =>
  import('./orders/PortalOrderDetail').then((m) => ({
    default: m.PortalOrderDetail,
  })),
);
const PortalDebtPage = lazy(() =>
  import('./debt/PortalDebtPage').then((m) => ({ default: m.PortalDebtPage })),
);
const PortalPaymentsPage = lazy(() =>
  import('./payments/PortalPaymentsPage').then((m) => ({
    default: m.PortalPaymentsPage,
  })),
);
const PortalShipmentsPage = lazy(() =>
  import('./shipments/PortalShipmentsPage').then((m) => ({
    default: m.PortalShipmentsPage,
  })),
);
const PortalShipmentDetail = lazy(() =>
  import('./shipments/PortalShipmentDetail').then((m) => ({
    default: m.PortalShipmentDetail,
  })),
);

export function CustomerPortalRouter() {
  return (
    <Suspense
      fallback={<div className="p-4 text-sm text-gray-500">Đang tải…</div>}
    >
      <Routes>
        <Route element={<CustomerPortalLayout />}>
          <Route index element={<PortalDashboardPage />} />
          <Route path="orders" element={<PortalOrdersPage />} />
          <Route path="orders/:id" element={<PortalOrderDetail />} />
          <Route path="debt" element={<PortalDebtPage />} />
          <Route path="payments" element={<PortalPaymentsPage />} />
          <Route path="shipments" element={<PortalShipmentsPage />} />
          <Route path="shipments/:id" element={<PortalShipmentDetail />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
