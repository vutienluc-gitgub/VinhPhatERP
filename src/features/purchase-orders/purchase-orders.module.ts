import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';

export const purchaseOrdersFeature: FeatureDefinition = {
  key: 'purchase-orders',
  route: '/purchase-orders',
  title: 'Purchase Orders',
  badge: 'Sourcing',
  description:
    'Quản lý đơn đặt hàng mua nguyên liệu (PO) và kiểm soát quá trình nhập kho.',
  summary: [
    { label: 'PO chờ duyệt', value: '0' },
    { label: 'Đang giao', value: '0' },
  ],
  highlights: [
    'Quản lý vòng đời PO: Nháp -> Duyệt -> Đang giao -> Hoàn tất.',
    'Chặn nhập kho khi không có PO hoặc vượt quá số lượng đặt.',
    'Tự động đồng bộ với hệ thống kho và công nợ NCC.',
  ],
  entities: [
    'purchase_orders',
    'purchase_order_items',
    'goods_receipts',
    'goods_receipt_items',
  ],
  nextMilestones: ['Tích hợp gửi PO qua Email/Zalo.'],
};

export const purchaseOrdersPlugin: FeaturePlugin = {
  key: 'purchase-orders',
  route: 'purchase-orders',
  label: 'Đơn Đặt Hàng (PO)',
  shortLabel: 'PO',
  description: 'Quản lý đơn đặt hàng mua nguyên liệu từ Nhà cung cấp.',
  icon: 'ShoppingCart',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'production',
  order: 5,
  routes: [
    {
      path: 'purchase-orders',
      component: () =>
        import('./PurchaseOrdersPage').then((m) => ({
          default: m.PurchaseOrdersPage,
        })),
    },
    {
      path: 'purchase-orders/create',
      component: () =>
        import('./POCreatePage').then((m) => ({
          default: m.POCreatePage,
        })),
    },
    {
      path: 'purchase-orders/:id',
      component: () =>
        import('./PODetailPage').then((m) => ({
          default: m.PODetailPage,
        })),
    },
  ],
};

export default createModule(purchaseOrdersFeature);
