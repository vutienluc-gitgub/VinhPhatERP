import { Outlet } from 'react-router-dom';

import { useChatNotifications } from '@/application/chat';
import { useAuth } from '@/shared/hooks/useAuth';

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
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-extrabold text-[0.85rem]">
            TX
          </div>
          <div>
            <p className="text-[0.75rem] font-bold text-[var(--text-primary)] m-0">
              {profile?.full_name ?? 'Tài xế'}
            </p>
            <p className="text-[0.65rem] text-[var(--text-tertiary)] m-0">
              Tài xế giao hàng
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-[0.8rem] text-[var(--text-secondary)] bg-transparent border border-[var(--border)] rounded-[var(--radius)] px-3 py-[6px] cursor-pointer"
        >
          Đăng xuất
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
