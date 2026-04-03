import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AppShell } from '@/app/layouts/AppShell'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { appRoutes, adminRoutes, authRoute, managerRoutes, printRoutes } from '@/app/router/routes'
import { BlockedPage, ProfilePage, UnauthorizedPage } from '@/features/auth'

const router = createBrowserRouter([
  // ---- Public routes (no auth required) ----
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

  // ---- Protected shell ----
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      ...printRoutes,
      {
        element: <AppShell />,
        children: [
          // All authenticated users
          ...appRoutes,
          { path: 'profile', element: <ProfilePage /> },

          // manager + admin only
          {
            element: <ProtectedRoute allowedRoles={['admin', 'manager']} />,
            children: managerRoutes,
          },

          // admin only
          {
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: adminRoutes,
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
