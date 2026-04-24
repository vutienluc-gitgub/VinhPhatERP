import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { withSuspense } from '@/app/router/routeWrappers';
import { BlockedPage } from '@/features/auth/BlockedPage';
import { UnauthorizedPage } from '@/features/auth/UnauthorizedPage';
import { authRoute } from '@/app/router/routes';

const TenantRegisterPage = lazy(() =>
  import('@/features/auth/TenantRegisterPage').then((m) => ({
    default: m.TenantRegisterPage,
  })),
);

export const publicRoutes: RouteObject[] = [
  authRoute,
  {
    path: '/register',
    element: withSuspense(<TenantRegisterPage />),
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/blocked',
    element: <BlockedPage />,
  },
];
