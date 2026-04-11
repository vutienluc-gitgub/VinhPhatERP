import { Outlet, NavLink } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';

/**
 * Minimal layout for Customer Portal.
 * No ERP sidebar or bottom nav — just header + content.
 */
export function CustomerPortalLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900 text-sm">
            Vĩnh Phát ERP
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600">Cổng khách hàng</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">{profile?.full_name}</span>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4">
        <div className="flex gap-1">
          {[
            {
              to: '/portal',
              label: 'Tổng quan',
              end: true,
            },
            {
              to: '/portal/orders',
              label: 'Đơn hàng',
            },
            {
              to: '/portal/debt',
              label: 'Công nợ',
            },
            {
              to: '/portal/payments',
              label: 'Thanh toán',
            },
            {
              to: '/portal/shipments',
              label: 'Giao hàng',
            },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3 py-2.5 text-sm border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
