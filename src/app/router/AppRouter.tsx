import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { driverRoutes } from '@/app/router/driverRoutes';
import { createErpShellRoute } from '@/app/router/erpShellRoutes';
import { GlobalErrorElement } from '@/app/router/GlobalErrorElement';
import { portalRoutes } from '@/app/router/portalRoutes';
import { publicRoutes } from '@/app/router/publicRoutes';

export function AppRouter() {
  const router = createBrowserRouter([
    {
      errorElement: <GlobalErrorElement />,
      children: [
        ...publicRoutes,
        ...driverRoutes,
        ...portalRoutes,
        createErpShellRoute(),
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
