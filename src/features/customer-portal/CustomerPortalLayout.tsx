import { Outlet, NavLink } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';

import './portal.css';

/**
 * Minimal layout for Customer Portal.
 * No ERP sidebar or bottom nav — just header + content.
 */
export function CustomerPortalLayout() {
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <div className="portal-shell">
      {/* Header */}
      <header className="portal-header">
        <div className="portal-header-brand">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #1a6ef5, #5b9aff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7"
              />
            </svg>
          </div>
          <span className="portal-brand-name">Vĩnh Phát ERP</span>
          <span className="portal-brand-sep">|</span>
          <span className="portal-brand-sub">Cổng khách hàng</span>
        </div>

        <div className="portal-header-user">
          {profile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1a6ef5, #5b9aff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <span className="portal-username">{profile.full_name}</span>
            </div>
          )}
          <button
            onClick={signOut}
            className="portal-signout-btn"
            type="button"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="portal-nav" aria-label="Portal navigation">
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
