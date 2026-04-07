import type { FeatureDefinition } from '@/shared/types/feature'

export {
  SHIPMENT_STATUS_LABELS,
  emptyShipmentItem,
  shipmentsSchema,
  shipmentsDefaultValues,
  deliveryConfirmSchema,
  deliveryConfirmDefaultValues,
} from '@/schema/shipment.schema'
export type {
  ShipmentStatus,
  ShipmentItemFormValues,
  ShipmentsFormValues,
  DeliveryConfirmFormValues,
} from '@/schema/shipment.schema'

export const shipmentsFeature: FeatureDefinition = {
  key: 'shipments',
  route: '/shipments',
  title: 'Xuất kho',
  badge: 'Scaffolded',
  description: 'Shipment được tạo từ order items và là điểm duy nhất làm giảm tồn kho thực tế trong V2.',
  highlights: [
    'Tạo shipment từ order và chống xuất vượt remaining qty.',
    'Cập nhật partial shipped và completed status.',
    'Sẵn sàng cho in phiếu giao hàng ở phase sau.',
  ],
  resources: [
    'Bang shipments va shipment_items.',
    'Business rule confirm shipment tru kho.',
    'Lien ket inventory va payments.',
  ],
  entities: ['Shipment header', 'Shipment item', 'Delivery proof', 'Stock deduction'],
  nextMilestones: [
    'Them tao shipment tu order detail.',
    'Khoa chinh sua sau khi shipment confirmed.',
    'Cho phep giao tung phan va in phieu giao.',
  ],
}