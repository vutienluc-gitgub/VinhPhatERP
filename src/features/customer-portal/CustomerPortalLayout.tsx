import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/features/auth/AuthProvider';
import { PortalLayout } from '@/features/portal-shared/components/PortalLayout';
import { useChatNotifications, usePortalChatUnread } from '@/application/chat';
import { useAppBadging } from '@/shared/hooks/useAppBadging';

import {
  NotificationProvider,
  useNotifications,
} from './notifications/useNotifications';
import { NotificationBadge } from './notifications/NotificationBadge';
import * as RealtimeService from './notifications/RealtimeService';
import { CUSTOMER_PORTAL_NAV_ITEMS } from './customer-portal.module';
import './portal.css';

/**
 * Inner layout — has access to NotificationContext
 */
function PortalLayoutInner() {
  const { profile } = useAuth();
  const { addNotification, setConnectionWarning, unreadCount } =
    useNotifications();
  const location = useLocation();

  const unreadChatCount = usePortalChatUnread(
    profile?.customer_id ?? undefined,
    'customer',
  );

  // Enable global chat notifications (with sound)
  useChatNotifications({ soundEnabled: true });

  // Sync PWA App Badge (iOS / Android / Desktop) with total unread
  const totalDeviceUnreadCount = unreadCount + unreadChatCount;
  useAppBadging({ unreadCount: totalDeviceUnreadCount });

  // Start/stop RealtimeService based on customer_id
  useEffect(() => {
    const customerId = profile?.customer_id;
    if (!customerId) return;

    RealtimeService.start({
      customerId,
      onNotification: addNotification,
      onDataUpdate: () => {},
      onConnectionWarning: setConnectionWarning,
    });

    return () => {
      RealtimeService.stop();
    };
  }, [profile?.customer_id, addNotification, setConnectionWarning]);

  return (
    <PortalLayout
      brandSub="Cổng khách hàng"
      navItems={CUSTOMER_PORTAL_NAV_ITEMS}
      entityType="customer"
      entityId={profile?.customer_id ?? undefined}
      chatTitle="Hỗ trợ khách hàng"
      unreadChatCount={unreadChatCount}
      headerRightActions={<NotificationBadge />}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </PortalLayout>
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
