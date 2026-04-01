import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'
import type { ShipmentStatus } from './types'

/* ── Constants ── */

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  preparing: 'Đang chuẩn bị',
  shipped: 'Đã giao',
  delivered: 'Đã nhận',
  partially_returned: 'Trả một phần',
  returned: 'Đã trả lại',
}

/* ── Zod schemas ── */

const shipmentItemSchema = z.object({
  finishedRollId: z.string().uuid().optional().or(z.literal('')),
  fabricType: z.string().trim().min(2, 'Nhập loại vải'),
  quantity: z.number().positive('Số lượng > 0'),
})

export type ShipmentItemFormValues = z.infer<typeof shipmentItemSchema>

export const emptyShipmentItem: ShipmentItemFormValues = {
  finishedRollId: '',
  fabricType: '',
  quantity: 0,
}

export const shipmentsSchema = z.object({
  shipmentNumber: z.string().trim().min(3, 'Nhập số phiếu xuất'),
  orderId: z.string().uuid('Chọn đơn hàng'),
  customerId: z.string().uuid('Chọn khách hàng'),
  shipmentDate: z.string().trim().min(1, 'Chọn ngày giao'),
  deliveryAddress: z.string().trim().max(255).optional().or(z.literal('')),
  items: z.array(shipmentItemSchema).min(1, 'Thêm ít nhất 1 dòng hàng'),
})

export type ShipmentsFormValues = z.infer<typeof shipmentsSchema>

export const shipmentsDefaultValues: ShipmentsFormValues = {
  shipmentNumber: '',
  orderId: '',
  customerId: '',
  shipmentDate: new Date().toISOString().slice(0, 10),
  deliveryAddress: '',
  items: [{ ...emptyShipmentItem }],
}

export const shipmentsFeature: FeatureDefinition = {
  key: 'shipments',
  route: '/shipments',
  title: 'Xuất kho',
  badge: 'Scaffolded',
  description:
    'Shipment được tạo từ order items và là điểm duy nhất làm giảm tồn kho thực tế trong V2.',
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