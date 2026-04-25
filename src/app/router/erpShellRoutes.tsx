import type { RouteObject } from 'react-router-dom';

import { AppShell } from '@/app/layouts/AppShell';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import {
  createAppRoutes,
  createManagerRoutes,
  createAdminRoutes,
  createPrintRoutes,
} from '@/app/router/routes';
import { ProfilePage } from '@/features/auth/ProfilePage';

export function createErpShellRoute(): RouteObject {
  return {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      ...createPrintRoutes(),
      {
        element: <AppShell />,
        children: [
          ...createAppRoutes(),
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            element: <ProtectedRoute allowedRoles={['admin', 'manager']} />,
            children: createManagerRoutes(),
          },
          {
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: createAdminRoutes(),
          },
        ],
      },
    ],
  };
}
