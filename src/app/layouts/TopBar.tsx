import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

import type { NavigationItem } from '@/app/router/routes';
import {
  ChatDrawer,
  ChatInboxDrawer,
  useChatNavigation,
  useChatNavigationSync,
} from '@/features/chat';
import { Icon } from '@/shared/components/Icon';
import { APP_SHELL_LABELS, USER_ROLE_LABELS } from '@/shared/constants/layout';
import { GROUP_LABELS } from '@/shared/constants/navigation';
import type { UserPreferences } from '@/shared/hooks/useUserPreferences';
import type { TableRow } from '@/shared/types/database.models';

import { AppLauncher } from './AppLauncher';
import { NotificationBell } from './NotificationBell';

type Profile = TableRow<'profiles'>;

interface TopBarProps {
  profile: Profile | null | undefined;
  signOut: () => Promise<void>;
  prefs: UserPreferences;
  toggleTheme: () => void;
  totalUnread: number;
  currentItem: NavigationItem | undefined;
  onOpenCosting: () => void;
  initials: string;
}

export const TopBar = React.memo(function TopBar({
  profile,
  signOut,
  prefs,
  toggleTheme,
  totalUnread,
  currentItem,
  onOpenCosting,
  initials,
}: TopBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChatInbox, setShowChatInbox] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Centralized Chat Navigation Controller
  const { isOpen, activeIntent, closeChat } = useChatNavigation();
  useChatNavigationSync();

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  return (
    <header className="topbar">
      {/* App Launcher & Brand Block */}
      <div className="topbar-brand-block">
        <AppLauncher />
        <NavLink to="/" className="topbar-brand-logo">
          <img
            src="/favicon.svg"
            alt="Logo"
            className="w-6 h-6 object-contain"
          />
          <h1 className="hidden sm:block title-premium-gradient text-base font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-primary-strong to-primary">
            {APP_SHELL_LABELS.BRAND_NAME}
          </h1>
        </NavLink>
      </div>

      <div className="topbar-divider" />

      {/* Breadcrumb */}
      <nav className="hidden sm:flex topbar-breadcrumb" aria-label="Breadcrumb">
        <NavLink to="/">
          <Icon name="Home" size={15} strokeWidth={1.5} />
        </NavLink>
        {currentItem && currentItem.path !== '/' && (
          <>
            <Icon
              name="ChevronRight"
              size={12}
              className="topbar-breadcrumb-sep"
            />
            {currentItem.group && GROUP_LABELS[currentItem.group] && (
              <>
                <span className="topbar-breadcrumb-current">
                  {GROUP_LABELS[currentItem.group]!.label}
                </span>
                <Icon
                  name="ChevronRight"
                  size={12}
                  className="topbar-breadcrumb-sep"
                />
              </>
            )}
            <span className="topbar-breadcrumb-current">
              {currentItem.label}
            </span>
          </>
        )}
        {!currentItem && (
          <span className="topbar-breadcrumb-current">
            {APP_SHELL_LABELS.HOME}
          </span>
        )}
      </nav>

      <div className="topbar-spacer" />

      {/* Action icons */}
      <div className="topbar-actions" ref={userMenuRef}>
        <NavLink
          to="/guide"
          className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-surface-subtle hover:text-foreground transition-colors mr-1"
          title={APP_SHELL_LABELS.GUIDE_TITLE}
        >
          <Icon name="BookOpen" size={16} strokeWidth={1.5} />
          <span className="hidden md:inline">{APP_SHELL_LABELS.GUIDE}</span>
        </NavLink>

        <button
          type="button"
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
            )
          }
          className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-surface-subtle hover:text-foreground transition-colors mr-1"
          title={APP_SHELL_LABELS.SEARCH_PLACEHOLDER}
        >
          <Icon name="Search" size={16} strokeWidth={1.5} />
          <span className="hidden md:inline">{APP_SHELL_LABELS.SEARCH}</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-surface-subtle text-[10px] font-medium text-muted-foreground">
            {APP_SHELL_LABELS.SEARCH_KBD}
          </kbd>
        </button>

        <button
          type="button"
          className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-foreground hover:bg-primary/10 transition-colors mr-1"
          onClick={onOpenCosting}
          title={APP_SHELL_LABELS.CALCULATOR_TITLE}
        >
          <Icon name="Calculator" size={16} strokeWidth={1.5} />
          <span className="hidden md:inline">
            {APP_SHELL_LABELS.CALCULATOR}
          </span>
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={toggleTheme}
          title={
            prefs.theme === 'dark'
              ? APP_SHELL_LABELS.THEME_LIGHT
              : APP_SHELL_LABELS.THEME_DARK
          }
          aria-label="Toggle Theme"
        >
          <Icon
            name={prefs.theme === 'dark' ? 'Sun' : 'Moon'}
            size={17}
            strokeWidth={1.5}
          />
        </button>

        {profile?.role !== 'customer' && (
          <>
            <button
              type="button"
              className="topbar-icon-btn topbar-chat-inbox-btn relative"
              onClick={() => setShowChatInbox(true)}
              title={APP_SHELL_LABELS.INBOX}
              aria-label={APP_SHELL_LABELS.INBOX}
            >
              <Icon name="MessageSquare" size={17} strokeWidth={1.5} />
              {totalUnread > 0 && (
                <span className="topbar-chat-badge">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </button>
            <NotificationBell />
          </>
        )}

        {/* Direct Room Chat Drawer (when opened via Push Notification or Deep link intent) */}
        {isOpen && activeIntent?.roomId ? (
          <ChatDrawer
            open={isOpen}
            onClose={closeChat}
            roomId={activeIntent.roomId}
            messageId={activeIntent.messageId}
            entityType={activeIntent.entityType}
            entityId={activeIntent.entityId}
            title={activeIntent.title}
            subtitle={activeIntent.subtitle}
          />
        ) : (
          <ChatInboxDrawer
            open={showChatInbox}
            onClose={() => setShowChatInbox(false)}
          />
        )}

        {profile && (
          <button
            type="button"
            className="user-trigger"
            onClick={() => setShowUserMenu((v) => !v)}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <span className="user-avatar">{initials}</span>
            <span className="hidden sm:block user-name">
              {profile.full_name || profile.id.slice(0, 8)}
            </span>
            <div className="hidden sm:flex">
              <Icon name="ChevronDown" size={16} strokeWidth={1.5} />
            </div>
          </button>
        )}

        {showUserMenu && profile && (
          <div className="user-dropdown" role="menu">
            <div className="user-dropdown-header">
              <span className="user-dropdown-name">
                {profile.full_name || profile.id}
              </span>
              <span className="status-pill">
                {USER_ROLE_LABELS[profile.role] ?? profile.role}
              </span>
            </div>
            <div className="user-dropdown-divider" />
            <button
              type="button"
              className="user-dropdown-item"
              role="menuitem"
              onClick={() => {
                setShowUserMenu(false);
                void signOut();
              }}
            >
              <Icon name="LogOut" size={16} strokeWidth={1.5} />
              {APP_SHELL_LABELS.LOGOUT}
            </button>
          </div>
        )}
      </div>
    </header>
  );
});
