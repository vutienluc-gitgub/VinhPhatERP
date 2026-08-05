import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/features/auth/AuthProvider';
import { PortalLayout } from '@/features/portal-shared/components/PortalLayout';
import { usePortalChatUnread } from '@/application/chat';
import { NotificationCenter } from '@/features/supplier-portal/notifications/NotificationCenter';
import { InteractionProvider } from '@/shared/interaction';

export function SupplierPortalLayout() {
  const { profile } = useAuth();
  const location = useLocation();

  const supplierId = profile?.supplier_id ?? undefined;

  const unreadChatCount = usePortalChatUnread(supplierId);

  const navItems = [
    { to: '/portal/supplier', label: 'Tổng quan', end: true },
    { to: '/portal/supplier/orders', label: 'Đơn hàng (PO)' },
    { to: '/portal/supplier/quotations', label: 'Báo giá (RFQ)' },
    { to: '/portal/supplier/invoices', label: 'Hóa đơn' },
    { to: '/portal/supplier/debt', label: 'Công nợ' },
    { to: '/portal/supplier/deliveries', label: 'Giao hàng' },
    { to: '/portal/supplier/profile', label: 'Hồ sơ' },
  ];

  return (
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
  );
}
