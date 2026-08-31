import React, { useState, useRef, useEffect } from 'react';

import { CHAT_LABELS } from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';

export interface TypingUserItem {
  userId: string;
  userName: string;
  timestamp?: number;
}

interface ChatHeaderV3Props {
  title?: string;
  subtitle?: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastActiveAt?: string | null;
  isTyping?: boolean;
  typingUsers?: TypingUserItem[] | string[];
  onClose: () => void;
  onToggleSearch?: () => void;
  isSearchActive?: boolean;
  onOpenDetails?: () => void;
}

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'VP';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return (parts[0]?.slice(0, 2) ?? 'VP').toUpperCase();
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase() || 'VP';
}

function formatRelativePresence(
  lastActiveAt?: string | null,
  fallbackSubtitle?: string,
): string {
  if (!lastActiveAt) {
    return fallbackSubtitle || CHAT_LABELS.ACCESSED_LONG_AGO;
  }

  const diffMs = Date.now() - new Date(lastActiveAt).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) {
    return CHAT_LABELS.ACCESSED_JUST_NOW;
  }
  if (diffMins < 60) {
    return CHAT_LABELS.ACCESSED_MINS_AGO.replace('{mins}', String(diffMins));
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return CHAT_LABELS.ACCESSED_HOURS_AGO.replace('{hours}', String(diffHours));
  }
  return fallbackSubtitle || CHAT_LABELS.ACCESSED_LONG_AGO;
}

export const ChatHeaderV3 = React.memo(function ChatHeaderV3({
  title,
  subtitle,
  avatarUrl,
  isOnline = true,
  lastActiveAt,
  isTyping = false,
  typingUsers = [],
  onClose,
  onToggleSearch,
  isSearchActive = false,
  onOpenDetails,
}: ChatHeaderV3Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayTitle = title || CHAT_LABELS.TITLE;
  const initials = getInitials(displayTitle);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  let statusText = '';
  let statusClass = 'text-muted';

  if (isTyping || typingUsers.length > 0) {
    statusText = CHAT_LABELS.TYPING_STATUS;
    statusClass = 'text-primary font-medium animate-pulse';
  } else if (isOnline) {
    statusText = subtitle
      ? `${subtitle} • ${CHAT_LABELS.ACTIVE_NOW}`
      : CHAT_LABELS.ACTIVE_NOW;
    statusClass = 'text-success font-medium';
  } else {
    statusText = formatRelativePresence(lastActiveAt, subtitle);
    statusClass = 'text-muted';
  }

  return (
    <header className="chat-header-v3 flex items-center justify-between px-2.5 sm:px-3.5 pb-2.5 pt-[calc(10px+env(safe-area-inset-top,0px))] bg-surface border-b border-border select-none relative shrink-0">
      {/* Left: Back/Close & Avatar & Meta */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={onClose}
          className="chat-header-close-btn w-10 h-10 flex items-center justify-center -ml-1.5 text-foreground hover:text-primary rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer border-none bg-transparent shrink-0"
          aria-label={CHAT_LABELS.CLOSE}
          title={CHAT_LABELS.CLOSE}
        >
          <Icon name="ChevronLeft" size={22} strokeWidth={2.25} />
        </button>

        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayTitle}
              className="w-9 h-9 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
              {initials}
            </div>
          )}
          {isOnline && (
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-surface"
              aria-label={CHAT_LABELS.ACTIVE_NOW}
            />
          )}
        </div>

        {/* Name & Presence Info */}
        <div className="min-w-0 flex-1 ml-0.5">
          <h2 className="text-sm font-semibold text-foreground truncate m-0 leading-snug">
            {displayTitle}
          </h2>
          <p
            className={`text-xs truncate m-0 leading-normal flex items-center gap-1 ${statusClass}`}
          >
            {statusText}
          </p>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-0.5 shrink-0 ml-1">
        {onToggleSearch && (
          <button
            type="button"
            onClick={onToggleSearch}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer border-none bg-transparent ${
              isSearchActive
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-secondary'
            }`}
            aria-label={CHAT_LABELS.SEARCH}
            title={CHAT_LABELS.SEARCH_MESSAGES}
          >
            <Icon name="Search" size={18} strokeWidth={1.75} />
          </button>
        )}

        {/* Menu ⋮ */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-secondary rounded-xl transition-colors cursor-pointer border-none bg-transparent"
            aria-label={CHAT_LABELS.MORE_OPTIONS}
            title={CHAT_LABELS.MORE_OPTIONS}
          >
            <Icon name="MoreVertical" size={18} strokeWidth={1.75} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-surface border border-border rounded-xl shadow-lg py-1 z-50 text-xs text-foreground">
              {onOpenDetails && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenDetails();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-surface-secondary transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer text-foreground"
                >
                  <Icon name="Info" size={15} className="text-muted" />
                  <span>{CHAT_LABELS.VIEW_PARTNER_INFO}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onClose();
                }}
                className="w-full px-3 py-2 text-left hover:bg-danger-soft transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer text-danger"
              >
                <Icon name="X" size={15} />
                <span>{CHAT_LABELS.CLOSE_CHAT}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
