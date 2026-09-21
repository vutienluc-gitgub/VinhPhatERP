import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/features/auth/AuthProvider';
import { PortalLayout } from '@/features/portal-shared/components/PortalLayout';
import { useChatNotifications, usePortalChatUnread } from '@/application/chat';
import { useAppBadging } from '@/shared/hooks/useAppBadging';
import { customerPortalAudit } from './audit/customerQueryAuditLogger';

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
  const { user, profile } = useAuth();
  const { addNotification, setConnectionWarning, unreadCount } =
    useNotifications();
  const location = useLocation();

  // Audit Logging for Customer Portal Session & Context
  useEffect(() => {
    const tracker = customerPortalAudit.startQuery('customer-portal-session', {
      caller: 'CustomerPortalLayout',
      userId: user?.id,
      email: user?.email,
      role: profile?.role,
      customerId: profile?.customer_id,
      path: location.pathname,
    });

    if (!profile?.customer_id) {
      tracker.logAnomaly({
        type: 'CUSTOMER_ID_MISMATCH',
        title: 'Customer Profile Missing customer_id',
        observedValue: { profileRole: profile?.role, customerId: profile?.customer_id },
        expectedBehavior: 'Authenticated portal user should have a valid profile.customer_id.',
        uiSymptom: 'Customer queries will fail or execute without tenant scope, chat context will be blank.',
        rootCause: 'User account in profiles table is not linked to any row in customers table.',
        suggestedFix: 'Link profile.customer_id to the appropriate customer record.',
      });
    }

    tracker.logComplete({ customerId: profile?.customer_id, status: 'INITIALIZED' });

    // Output helpful console diagnostic guide
    console.log(
      '%c[Customer Portal Audit Logger Active]%c Run %cwindow.__CUSTOMER_PORTAL_AUDIT__.explainUIErrors()%c or %cwindow.__CUSTOMER_PORTAL_AUDIT__.printSummary()%c to inspect customer query lifecycle and diagnose UI anomalies.',
      'background: #0284c7; color: #fff; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      'color: inherit;',
      'color: #0284c7; font-weight: bold;',
      'color: inherit;',
      'color: #0284c7; font-weight: bold;',
      'color: inherit;',
    );
  }, [user?.id, user?.email, profile?.role, profile?.customer_id, location.pathname]);

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
