import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { driverRoutes } from '@/app/router/driverRoutes';
import { erpShellRoute } from '@/app/router/erpShellRoutes';
import { portalRoutes } from '@/app/router/portalRoutes';
import { publicRoutes } from '@/app/router/publicRoutes';

const router = createBrowserRouter([
  ...publicRoutes,
  ...driverRoutes,
  ...portalRoutes,
  erpShellRoute,
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
