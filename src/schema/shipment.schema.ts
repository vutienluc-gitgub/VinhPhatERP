import { z } from 'zod';

export type ShipmentStatus =
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'partially_returned'
  | 'returned';

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  preparing: 'Đang chuẩn bị',
  shipped: 'Đã giao',
  delivered: 'Đã nhận',
  partially_returned: 'Trả một phần',
  returned: 'Đã trả lại',
};

const shipmentItemSchema = z.object({
  finishedRollId: z.string().uuid().optional().or(z.literal('')),
  fabricType: z.string().trim().min(2, 'Nhập loại vải'),
  quantity: z.number().positive('Số lượng > 0'),
});

export type ShipmentItemFormValues = z.infer<typeof shipmentItemSchema>;

export const emptyShipmentItem: ShipmentItemFormValues = {
  finishedRollId: '',
  fabricType: '',
  quantity: 0,
};

export const shipmentsSchema = z.object({
  shipmentNumber: z.string().trim().min(3, 'Nhập số phiếu xuất'),
  orderId: z.string().uuid('Chọn đơn hàng'),
  customerId: z.string().uuid('Chọn khách hàng'),
  shipmentDate: z.string().trim().min(1, 'Chọn ngày giao'),
  deliveryAddress: z.string().trim().max(255).optional().or(z.literal('')),
  deliveryStaffId: z.string().uuid().optional().or(z.literal('')),
  shippingRateId: z.string().uuid().optional().or(z.literal('')),
  shippingCost: z.number().min(0, 'Chi phí phải >= 0'),
  loadingFee: z.number().min(0, 'Phí bốc xếp phải >= 0'),
  vehicleInfo: z.string().trim().max(100).optional().or(z.literal('')),
  items: z.array(shipmentItemSchema).min(1, 'Thêm ít nhất 1 dòng hàng'),
});

export type ShipmentsFormValues = z.infer<typeof shipmentsSchema>;

export const shipmentsDefaultValues: ShipmentsFormValues = {
  shipmentNumber: '',
  orderId: '',
  customerId: '',
  shipmentDate: new Date().toISOString().slice(0, 10),
  deliveryAddress: '',
  deliveryStaffId: '',
  shippingRateId: '',
  shippingCost: 0,
  loadingFee: 0,
  vehicleInfo: '',
  items: [{ ...emptyShipmentItem }],
};

export const deliveryConfirmSchema = z.object({
  receiverName: z.string().trim().min(1, 'Nhập tên người nhận'),
  receiverPhone: z.string().trim().optional().or(z.literal('')),
  deliveryProof: z.string().trim().min(1, 'Bắt buộc chụp ảnh biên nhận'),
  notes: z.string().trim().optional().or(z.literal('')),
});

export type DeliveryConfirmFormValues = z.infer<typeof deliveryConfirmSchema>;

export const deliveryConfirmDefaultValues: DeliveryConfirmFormValues = {
  receiverName: '',
  receiverPhone: '',
  deliveryProof: '',
  notes: '',
};
