import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

import { fetchSupplierById } from '@/api/suppliers.api';
import { usePortalChatUnread, useChatNotifications } from '@/application/chat';
import { useSupplierCapabilities } from '@/application/crm';
import { useAuth } from '@/features/auth/AuthProvider';
import { PortalLayout } from '@/features/portal-shared/components/PortalLayout';
import { SupplierEntitlementProvider } from '@/features/supplier-portal/context/SupplierEntitlementContext';
import { NotificationCenter } from '@/features/supplier-portal/notifications/NotificationCenter';
import { resolveSupplierEntitlements } from '@/features/supplier-portal/utils/entitlementResolver';
import { Icon } from '@/shared/components';
import { useAppBadging } from '@/shared/hooks/useAppBadging';
import { InteractionProvider } from '@/shared/interaction';

export function SupplierPortalLayout() {
  const { profile } = useAuth();
  const location = useLocation();

  const supplierId = profile?.supplier_id ?? undefined;
  const unreadChatCount = usePortalChatUnread(supplierId, 'supplier');

  // Global chat notifications — sound + toast for incoming chat messages
  useChatNotifications({ soundEnabled: true });

  // Sync PWA App Badge (iOS / Android / Desktop)
  useAppBadging({ unreadCount: unreadChatCount });

  const { data: supplier, isLoading: isSupplierLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => fetchSupplierById(supplierId!),
    enabled: !!supplierId,
  });

  const { data: capabilities = [], isLoading: isCapsLoading } =
    useSupplierCapabilities(supplierId ?? null);

  const isLoading = isSupplierLoading || isCapsLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Icon
          name="loader-2"
          className="h-8 w-8 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  const entitlements = resolveSupplierEntitlements(
    capabilities,
    supplier?.category,
  );

  const navItems = [
    { to: '/portal/supplier', label: 'Tổng quan', end: true, icon: 'home' },
    ...(entitlements.has('VIEW_WORK_ORDER')
      ? [
          {
            to: '/portal/supplier/work-orders',
            label: 'Lệnh gia công',
            icon: 'package',
          },
        ]
      : []),
    ...(entitlements.has('CONFIRM_MATERIAL')
      ? [
          {
            to: '/portal/supplier/material-receipts',
            label: 'Nhận vật tư',
            icon: 'truck',
          },
        ]
      : []),
    ...(entitlements.has('VIEW_PO')
      ? [
          {
            to: '/portal/supplier/orders',
            label: 'Đơn hàng (PO)',
            icon: 'package',
          },
        ]
      : []),
    ...(entitlements.has('VIEW_RFQ')
      ? [
          {
            to: '/portal/supplier/quotations',
            label: 'Báo giá (RFQ)',
            icon: 'file-question',
          },
        ]
      : []),
    ...(entitlements.has('CONFIRM_DELIVERY')
      ? [
          {
            to: '/portal/supplier/deliveries',
            label: 'Giao hàng',
            icon: 'truck',
          },
        ]
      : []),
    ...(entitlements.has('SUBMIT_INVOICE')
      ? [
          {
            to: '/portal/supplier/invoices',
            label: 'Hóa đơn',
            icon: 'file-text',
          },
        ]
      : []),
    ...(entitlements.has('VIEW_DEBT')
      ? [
          {
            to: '/portal/supplier/debt',
            label: 'Công nợ',
            icon: 'calculator',
          },
        ]
      : []),
    { to: '/portal/supplier/profile', label: 'Hồ sơ', icon: 'user' },
  ];

  return (
    <SupplierEntitlementProvider
      capabilities={capabilities}
      categoryFallback={supplier?.category}
      isLoading={isLoading}
    >
      <InteractionProvider>
        <PortalLayout
          brandSub="Cổng nhà cung cấp"
          navItems={navItems}
          entityType="supplier"
          entityId={supplierId}
          chatTitle="Hỗ trợ nhà cung cấp"
          unreadChatCount={unreadChatCount}
          headerRightActions={<NotificationCenter />}
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
      </InteractionProvider>
    </SupplierEntitlementProvider>
  );
}
