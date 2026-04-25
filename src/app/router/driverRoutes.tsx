import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { withSuspense } from '@/app/router/routeWrappers';
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
            element: withSuspense(<DriverPortalPage />),
          },
        ],
      },
    ],
  },
];
