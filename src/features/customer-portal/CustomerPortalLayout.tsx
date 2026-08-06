import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/features/auth/AuthProvider';
import { PortalLayout } from '@/features/portal-shared/components/PortalLayout';
import { useChatNotifications, usePortalChatUnread } from '@/application/chat';
// eslint-disable-next-line boundaries/dependencies

import {
  NotificationProvider,
  useNotifications,
} from './notifications/useNotifications';
import { NotificationBadge } from './notifications/NotificationBadge';
import * as RealtimeService from './notifications/RealtimeService';
import './portal.css';

/**
 * Inner layout — has access to NotificationContext
 */
function PortalLayoutInner() {
  const { profile } = useAuth();
  const { addNotification, setConnectionWarning } = useNotifications();
  const location = useLocation();

  const unreadChatCount = usePortalChatUnread(
    profile?.customer_id ?? undefined,
  );

  // Enable global chat notifications (with sound)
  useChatNotifications({ soundEnabled: true });

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

  const navItems = [
    { to: '/portal/customer', label: 'Tổng quan', end: true },
    { to: '/portal/customer/fabric-catalog', label: 'Danh mục sản phẩm' },
    { to: '/portal/customer/quotations', label: 'Báo giá' },
    { to: '/portal/customer/orders', label: 'Đơn hàng' },
    { to: '/portal/customer/debt', label: 'Công nợ' },
    { to: '/portal/customer/payments', label: 'Thanh toán' },
    { to: '/portal/customer/shipments', label: 'Giao hàng' },
  ];

  return (
    <PortalLayout
      brandSub="Cổng khách hàng"
      navItems={navItems}
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
