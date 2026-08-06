import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthProvider';
import { PortalLayout } from '@/features/portal-shared/components/PortalLayout';
import { usePortalChatUnread } from '@/application/chat';
import { NotificationCenter } from '@/features/supplier-portal/notifications/NotificationCenter';
import { InteractionProvider } from '@/shared/interaction';
import { fetchSupplierById } from '@/api/suppliers.api';
import { Icon } from '@/shared/components';

export function SupplierPortalLayout() {
  const { profile } = useAuth();
  const location = useLocation();

  const supplierId = profile?.supplier_id ?? undefined;
  const unreadChatCount = usePortalChatUnread(supplierId);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => fetchSupplierById(supplierId!),
    enabled: !!supplierId,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Icon name="loader-2" className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  const isSubcontractor =
    supplier?.category === 'weaving' || supplier?.category === 'dyeing';

  const navItems = isSubcontractor
    ? [
        { to: '/portal/supplier', label: 'Tổng quan', end: true, icon: 'home' },
        {
          to: '/portal/supplier/work-orders',
          label: 'Lệnh gia công',
          icon: 'package',
        },
        {
          to: '/portal/supplier/material-receipts',
          label: 'Nhận vật tư',
          icon: 'truck',
        },
        {
          to: '/portal/supplier/invoices',
          label: 'Hóa đơn',
          icon: 'file-text',
        },
        { to: '/portal/supplier/debt', label: 'Công nợ', icon: 'calculator' },
        { to: '/portal/supplier/profile', label: 'Hồ sơ', icon: 'user' },
      ]
    : [
        { to: '/portal/supplier', label: 'Tổng quan', end: true, icon: 'home' },
        {
          to: '/portal/supplier/orders',
          label: 'Đơn hàng (PO)',
          icon: 'package',
        },
        {
          to: '/portal/supplier/quotations',
          label: 'Báo giá (RFQ)',
          icon: 'file-question',
        },
        {
          to: '/portal/supplier/invoices',
          label: 'Hóa đơn',
          icon: 'file-text',
        },
        { to: '/portal/supplier/debt', label: 'Công nợ', icon: 'calculator' },
        {
          to: '/portal/supplier/deliveries',
          label: 'Giao hàng',
          icon: 'truck',
        },
        { to: '/portal/supplier/profile', label: 'Hồ sơ', icon: 'user' },
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
