import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/shared/components';
import { NOTIFICATION_BELL_LABELS } from '@/shared/constants/layout';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { resolveDeepLink } from '@/shared/notifications/deepLinkResolver';
import type { NotificationDomain } from '@/domains/notification/models/types';

function getDomainIconName(domain: NotificationDomain): string {
  switch (domain) {
    case 'purchasing':
      return 'ShoppingCart';
    case 'approval':
      return 'CheckSquare';
    case 'inventory':
      return 'Package';
    case 'finance':
      return 'CircleDollarSign';
    case 'production':
      return 'Factory';
    case 'system':
    default:
      return 'Megaphone';
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(10);

  // Đóng khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: {
    id: string;
    entity_type: string;
    entity_id: string;
    action?: string;
    read_at?: string | null;
  }) => {
    setIsOpen(false);
    if (!notif.read_at) {
      try {
        await markAsRead(notif.id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to mark read', err);
      }
    }
    const targetUrl = resolveDeepLink({
      entity_type: notif.entity_type,
      entity_id: notif.entity_id,
      action: notif.action,
    });
    navigate(targetUrl);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={NOTIFICATION_BELL_LABELS.TITLE}
        className="relative flex items-center justify-center bg-transparent hover:bg-surface rounded-full w-9 h-9 cursor-pointer text-muted-foreground hover:text-foreground transition-colors border-none p-0"
      >
        <Icon name="Bell" size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface sticky top-0">
            <div className="flex items-center gap-2 text-foreground">
              <Icon name="Bell" size={16} strokeWidth={2} />
              <h3 className="font-bold text-xs uppercase m-0 tracking-wider">
                {NOTIFICATION_BELL_LABELS.TITLE}
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-danger/10 text-danger rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium border-none bg-transparent cursor-pointer p-0"
                >
                  {NOTIFICATION_BELL_LABELS.MARK_ALL_READ}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-danger opacity-70 hover:opacity-100 transition-opacity border-none bg-transparent cursor-pointer p-0"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Icon name="CheckCircle2" size={28} className="opacity-40" />
                <p className="text-sm">{NOTIFICATION_BELL_LABELS.EMPTY}</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read_at;
                const iconName = getDomainIconName(notif.domain);

                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full p-3.5 text-left hover:bg-hover active:bg-active transition-colors flex gap-3 items-start border-none bg-transparent cursor-pointer ${
                      isUnread ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 shrink-0 flex items-center justify-center ${
                        isUnread
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted/10 text-muted-foreground'
                      }`}
                    >
                      <Icon name={iconName} size={18} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p
                          className={`text-xs font-semibold leading-tight truncate ${
                            isUnread
                              ? 'text-foreground font-bold'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {notif.title}
                        </p>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                      <span className="text-[11px] text-muted-foreground/70 mt-1 block">
                        {/* eslint-disable-next-line no-restricted-syntax */}
                        {new Date(notif.created_at).toLocaleTimeString(
                          'vi-VN',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          },
                        )}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
