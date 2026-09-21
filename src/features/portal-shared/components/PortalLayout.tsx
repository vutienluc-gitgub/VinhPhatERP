import React, { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { ChatWidget } from '@/features/chat/ChatWidget';

export interface PortalLayoutNavItem {
  to: string;
  label: string;
  end?: boolean;
}

export interface PortalLayoutProps extends PropsWithChildren {
  brandSub?: string;
  navItems?: PortalLayoutNavItem[];
  entityType?: string;
  entityId?: string;
  chatTitle?: string;
  unreadChatCount?: number;
  headerRightActions?: React.ReactNode;
}

export function PortalLayout({
  children,
  brandSub = 'Cổng đối tác',
  navItems,
  entityType,
  entityId,
  chatTitle = 'Hỗ trợ trực tuyến',
  headerRightActions,
}: PortalLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              VP
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight text-slate-900 dark:text-slate-100">
                Vĩnh Phát ERP
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {brandSub}
              </div>
            </div>
          </div>

          {navItems && navItems.length > 0 && (
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {headerRightActions}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        {navItems && navItems.length > 0 && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800/80 px-4 py-2 flex items-center space-x-2 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Floating Chat Widget for portal partner */}
      {entityType && entityId && (
        <ChatWidget
          entityType={entityType}
          entityId={entityId}
          title={chatTitle}
        />
      )}
    </div>
  );
}

