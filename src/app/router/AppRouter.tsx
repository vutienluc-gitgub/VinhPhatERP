import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { driverRoutes } from '@/app/router/driverRoutes';
import { createErpShellRoute } from '@/app/router/erpShellRoutes';
import { GlobalErrorElement } from '@/app/router/GlobalErrorElement';
import { portalRoutes } from '@/app/router/portalRoutes';
import { publicRoutes } from '@/app/router/publicRoutes';

export function AppRouter() {
  const router = useMemo(
    () =>
      createBrowserRouter(
        [
          {
            errorElement: <GlobalErrorElement />,
            children: [
              ...publicRoutes,
              ...driverRoutes,
              ...portalRoutes,
              createErpShellRoute(),
            ],
          },
        ],
        {
          future: {
            v7_startTransition: true,
            v7_fetcherPersist: true,
            v7_normalizeFormMethod: true,
            v7_partialHydration: true,
            v7_skipActionErrorRevalidation: true,
            v7_relativeSplatPath: true,
          } as unknown as Partial<import('react-router-dom').FutureConfig>,
        },
      ),
    [],
  );

  return (
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  );
}
