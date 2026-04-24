import type { RouteObject } from 'react-router-dom';

import { AppShell } from '@/app/layouts/AppShell';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import {
  appRoutes,
  managerRoutes,
  adminRoutes,
  printRoutes,
} from '@/app/router/routes';
import { ProfilePage } from '@/features/auth/ProfilePage';

export const erpShellRoute: RouteObject = {
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
};
