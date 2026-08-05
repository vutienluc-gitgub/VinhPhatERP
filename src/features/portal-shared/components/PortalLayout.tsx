import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';
// eslint-disable-next-line boundaries/dependencies
import { ChatDrawer } from '@/features/chat/ChatDrawer';

// We reuse the CSS from customer-portal for now.
// Ideally it gets moved to portal-shared/styles/portal.css later.
import '@/features/customer-portal/portal.css';

export interface PortalNavItem {
  to: string;
  label: string;
  end?: boolean;
}

export interface PortalLayoutProps {
  /** The subtitle next to the brand name (e.g. 'Cổng khách hàng' or 'Cổng nhà cung cấp') */
  brandSub: string;
  /** Navigation links */
  navItems: PortalNavItem[];
  /** React Router Outlet or other children */
  children: React.ReactNode;

  // -- Chat specific configs --
  entityType?: 'customer' | 'supplier';
  entityId?: string;
  chatTitle?: string;
  chatSubtitle?: string;
  unreadChatCount?: number;

  // -- Header specific configs --
  headerRightActions?: React.ReactNode;
}

export function PortalLayout({
  brandSub,
  navItems,
  children,
  entityType,
  entityId,
  chatTitle,
  chatSubtitle,
  unreadChatCount = 0,
  headerRightActions,
}: PortalLayoutProps) {
  const { profile, signOut } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="portal-shell">
      {/* Header */}
      <header className="portal-header">
        <div className="portal-header-brand">
          <span className="portal-brand-name">Vĩnh Phát ERP</span>
          <span className="portal-brand-sep">|</span>
          <span className="portal-brand-sub">{brandSub}</span>
        </div>
        <div className="portal-header-user">
          <span className="portal-username">{profile?.full_name}</span>
          {headerRightActions}
          <button onClick={signOut} className="portal-signout-btn">
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="portal-nav">
        {navItems.map(({ to, label, end }) => (
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
      <main className="portal-content">{children}</main>

      {/* Floating chat button */}
      {entityId && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="portal-chat-fab"
          aria-label="Nhắn tin với nhân viên"
          title="Nhắn tin"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unreadChatCount > 0 && (
            <span className="portal-chat-fab-badge">
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </span>
          )}
        </button>
      )}

      {entityId && entityType && (
        <ChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          entityType={entityType}
          entityId={entityId}
          title={chatTitle ?? 'Hỗ trợ'}
          subtitle={chatSubtitle ?? 'Chat trực tiếp với nhân viên'}
        />
      )}
    </div>
  );
}
