import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const CUSTOMER_PORTAL_NAV_ITEMS = [
  {
    to: '/portal/customer',
    label: 'Tổng quan',
    end: true,
    icon: 'LayoutDashboard',
  },
  {
    to: '/portal/customer/fabric-catalog',
    label: 'Danh mục sản phẩm',
    icon: 'Layers',
  },
  { to: '/portal/customer/quotations', label: 'Báo giá', icon: 'FileText' },
  { to: '/portal/customer/orders', label: 'Đơn hàng', icon: 'ShoppingBag' },
  { to: '/portal/customer/debt', label: 'Công nợ', icon: 'Receipt' },
  { to: '/portal/customer/payments', label: 'Thanh toán', icon: 'CreditCard' },
  { to: '/portal/customer/shipments', label: 'Giao hàng', icon: 'Truck' },
];

export const customerPortalFeature: FeatureDefinition = {
  key: 'customer-portal',
  route: '/portal/customer',
  title: 'Cổng Khách Hàng',
  badge: 'Portal',
  description:
    'Cổng dịch vụ trực tuyến dành cho khách hàng: tra cứu sản phẩm, đơn hàng, công nợ, giao hàng.',
  summary: [
    {
      label: 'Phân hệ',
      value: 'Khách hàng (B2B Portal)',
    },
    {
      label: 'Phạm vi',
      value: 'Catalog, Báo giá, Đơn hàng, Công nợ, Giao hàng',
    },
  ],
  highlights: [
    'Theo dõi tiến độ đơn hàng và giao nhận trực tuyến theo thời gian thực.',
    'Tra cứu công nợ và biên nhận thanh toán minh bạch.',
    'Xem danh mục vải sợi và gửi yêu cầu báo giá tức thì.',
  ],
  entities: ['portal_orders', 'portal_debt', 'portal_shipments'],
  nextMilestones: [
    'Tích hợp trợ lý AI gợi ý vải và báo giá nhanh.',
    'Cổng thanh toán tự động VietQR động cho từng đợt thanh toán.',
  ],
};

export const customerPortalPlugin: FeaturePlugin = {
  key: 'customer-portal',
  route: 'portal/customer',
  entryPath: '/portal/customer',
  label: 'Cổng Khách Hàng',
  shortLabel: 'Cổng KH',
  description:
    'Cổng dịch vụ trực tuyến dành cho khách hàng: tra cứu sản phẩm, đơn hàng, công nợ, giao hàng.',
  icon: 'Globe',
  requiredRoles: ['customer', 'admin'],
  group: 'system',
  order: 95,
  routes: [
    {
      path: 'portal/customer',
      component: () =>
        import('./dashboard/PortalDashboardPage').then((m) => ({
          default: m.PortalDashboardPage,
        })),
    },
    {
      path: 'portal/customer/orders',
      component: () =>
        import('./orders/PortalOrdersPage').then((m) => ({
          default: m.PortalOrdersPage,
        })),
    },
    {
      path: 'portal/customer/orders/:id',
      component: () =>
        import('./orders/PortalOrderDetail').then((m) => ({
          default: m.PortalOrderDetail,
        })),
    },
    {
      path: 'portal/customer/debt',
      component: () =>
        import('./debt/PortalDebtPage').then((m) => ({
          default: m.PortalDebtPage,
        })),
    },
    {
      path: 'portal/customer/payments',
      component: () =>
        import('./payments/PortalPaymentsPage').then((m) => ({
          default: m.PortalPaymentsPage,
        })),
    },
    {
      path: 'portal/customer/shipments',
      component: () =>
        import('./shipments/PortalShipmentsPage').then((m) => ({
          default: m.PortalShipmentsPage,
        })),
    },
    {
      path: 'portal/customer/shipments/:id',
      component: () =>
        import('./shipments/PortalShipmentDetail').then((m) => ({
          default: m.PortalShipmentDetail,
        })),
    },
    {
      path: 'portal/customer/fabric-catalog',
      component: () =>
        import('./fabric-catalog/PortalFabricCatalogPage').then((m) => ({
          default: m.PortalFabricCatalogPage,
        })),
    },
    {
      path: 'portal/customer/quotations',
      component: () =>
        import('./quotations/PortalQuotationsPage').then((m) => ({
          default: m.PortalQuotationsPage,
        })),
    },
    {
      path: 'portal/customer/quotations/:id',
      component: () =>
        import('./quotations/PortalQuotationDetail').then((m) => ({
          default: m.PortalQuotationDetail,
        })),
    },
  ],
};

export default createModule(customerPortalFeature);
