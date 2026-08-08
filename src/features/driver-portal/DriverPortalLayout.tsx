import { Outlet } from 'react-router-dom';

import { useChatNotifications } from '@/application/chat';
import { useAuth } from '@/shared/hooks/useAuth';

import { DRIVER_PORTAL_MESSAGES } from './constants';

/**
 * DriverPortalLayout — Layout don gian cho cong tai xe.
 * Mobile-first, khong co sidebar.
 * Includes global chat notifications with SOUND ALERTS.
 */
export function DriverPortalLayout() {
  const { signOut, profile } = useAuth();

  // Global chat notifications — sound + toast for incoming dispatch messages
  useChatNotifications({ soundEnabled: true });

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-inverse-foreground font-extrabold text-sm">
            {DRIVER_PORTAL_MESSAGES.LAYOUT.AVATAR_INITIAL}
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--foreground)] m-0">
              {profile?.full_name ?? DRIVER_PORTAL_MESSAGES.LAYOUT.DEFAULT_NAME}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] m-0">
              {DRIVER_PORTAL_MESSAGES.LAYOUT.ROLE}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm text-[var(--surface-subtle)] bg-transparent border border-[var(--border)] rounded-md px-3 py-1.5 cursor-pointer hover:bg-[var(--surface-hover)]"
        >
          {DRIVER_PORTAL_MESSAGES.LAYOUT.LOGOUT}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
