import type { FeatureDefinition } from '@/shared/types/feature';
import { createModule } from '@/core/registry/moduleRegistry';
import {
  deliveryConfirmSchema,
  deliveryConfirmDefaultValues,
  emptyShipmentItem,
  shipmentsDefaultValues,
  shipmentsSchema,
  SHIPMENT_STATUS_LABELS,
  type ShipmentsFormValues,
  type DeliveryConfirmFormValues,
  type ShipmentItemFormValues,
} from '@/schema/shipment.schema';

export {
  deliveryConfirmSchema,
  deliveryConfirmDefaultValues,
  emptyShipmentItem,
  shipmentsDefaultValues,
  shipmentsSchema,
  SHIPMENT_STATUS_LABELS,
};

export type {
  ShipmentsFormValues,
  DeliveryConfirmFormValues,
  ShipmentItemFormValues,
};

export const shipmentsFeature: FeatureDefinition = {
  key: 'shipments',
  route: '/shipments',
  title: 'Giao hàng (Logistics)',
  badge: 'Shipping',
  description:
    'Quản lý phiếu xuất kho giao hàng, theo dõi đơn vị vận chuyển và trạng thái kiện hàng.',
  summary: [
    {
      label: 'Kiện hàng tháng',
      value: '850',
    },
    {
      label: 'Đang vận chuyển',
      value: '45',
    },
  ],
  highlights: [
    'Tích hợp in phiếu giao hàng.',
    'Theo dõi COD & Công nợ ship.',
    'Quản lý đội xe nội bộ.',
  ],
  entities: ['shipments', 'shipment_items'],
  nextMilestones: [
    'Tích hợp API các đơn vị vận chuyển (GHN, GHTK).',
    'Dự báo phí ship thông minh.',
  ],
};

import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';
export const shipmentsPlugin: FeaturePlugin = {
  key: 'shipments',
  route: 'shipments',
  label: 'Giao hàng',
  shortLabel: 'Ship',
  description:
    'Quản lý quy trình đóng gói và giao nhận hàng hóa tới khách hàng.',
  icon: 'package',
  requiredRoles: ['admin', 'manager', 'staff'],
  group: 'sales',
  order: 70,
  component: () =>
    import('./ShipmentsPage').then((m) => ({ default: m.ShipmentsPage })),
};

export default createModule(shipmentsFeature);
