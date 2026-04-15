import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';

import {
  NotificationProvider,
  useNotifications,
} from './notifications/useNotifications';
import { NotificationBadge } from './notifications/NotificationBadge';
import * as RealtimeService from './notifications/RealtimeService';
import './portal.css';

/**
 * Inner layout — has access to NotificationContext
 */
function PortalLayoutInner() {
  const { profile, signOut } = useAuth();
  const { addNotification, setConnectionWarning } = useNotifications();

  // Start/stop RealtimeService based on customer_id
  useEffect(() => {
    const customerId = profile?.customer_id;
    if (!customerId) return;

    RealtimeService.start({
      customerId,
      onNotification: addNotification,
      onDataUpdate: () => {
        // Data updates are handled by individual page hooks via their own state.
        // Pages that need realtime updates can subscribe to PortalDataEvent
        // via a shared event emitter in a future iteration.
      },
      onConnectionWarning: setConnectionWarning,
    });

    return () => {
      RealtimeService.stop();
    };
  }, [profile?.customer_id, addNotification, setConnectionWarning]);

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
          <NotificationBadge />
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
            to: '/portal/fabric-catalog',
            label: 'Danh mục sản phẩm',
          },
          {
            to: '/portal/quotations',
            label: 'Báo giá',
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

/**
 * Outer layout — provides NotificationContext
 */
export function CustomerPortalLayout() {
  return (
    <NotificationProvider>
      <PortalLayoutInner />
    </NotificationProvider>
  );
}
