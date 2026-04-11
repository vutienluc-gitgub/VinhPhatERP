import { Outlet, NavLink } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';

import './portal.css';

/**
 * Minimal layout for Customer Portal.
 * No ERP sidebar or bottom nav — just header + content.
 */
export function CustomerPortalLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="portal-shell">
      {/* Header */}
      <header className="portal-header">
        <div className="portal-header-brand">
          <span className="portal-brand-name">Vĩnh Phát ERP</span>
          <span className="portal-brand-sep">|</span>
          <span className="portal-brand-sub">Cổng khách hàng</span>
        </div>
        <div className="portal-header-user">
          <span className="portal-username">{profile?.full_name}</span>
          <button onClick={signOut} className="portal-signout-btn">
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="portal-nav">
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
              `portal-nav-item${isActive ? ' portal-nav-item--active' : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Content */}
      <main className="portal-content">
        <Outlet />
      </main>
    </div>
  );
}
