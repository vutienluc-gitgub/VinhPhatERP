import { Outlet } from 'react-router-dom';

import { useAuth } from '@/shared/hooks/useAuth';

/**
 * DriverPortalLayout — Layout don gian cho cong tai xe.
 * Mobile-first, khong co sidebar.
 */
export function DriverPortalLayout() {
  const { signOut, profile } = useAuth();

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '0.75rem 1rem',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
            }}
          >
            TX
          </div>
          <div>
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {profile?.full_name ?? 'Tài xế'}
            </p>
            <p
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-tertiary)',
              }}
            >
              Tài xế giao hàng
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Đăng xuất
        </button>
      </header>

      {/* Content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
