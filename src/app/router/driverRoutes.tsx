import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';

import { DriverPortalLayout } from '@/features/driver-portal/DriverPortalLayout';
import { DriverRoute } from '@/features/driver-portal/DriverRoute';

const DriverPortalPage = lazy(() =>
  import('@/features/driver-portal/DriverPortalPage').then((m) => ({
    default: m.DriverPortalPage,
  })),
);

export const driverRoutes: RouteObject[] = [
  {
    path: '/driver',
    element: <DriverRoute />,
    children: [
      {
        element: <DriverPortalLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div />}>
                <DriverPortalPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
];
