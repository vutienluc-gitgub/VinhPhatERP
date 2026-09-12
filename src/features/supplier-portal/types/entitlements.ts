export const PORTAL_ENTITLEMENTS = [
  'VIEW_PO', // Xem và phản hồi Đơn đặt hàng (PO)
  'VIEW_RFQ', // Nhận yêu cầu và nộp báo giá (RFQ)
  'VIEW_WORK_ORDER', // Xem và cập nhật tiến độ Lệnh gia công
  'CONFIRM_MATERIAL', // Xác nhận đối soát vật tư bàn giao
  'CONFIRM_DELIVERY', // Quản lý giao nhận số (ePOD / Giao hàng)
  'SUBMIT_INVOICE', // Nộp đề nghị thanh toán / bảng kê hóa đơn
  'VIEW_DEBT', // Tra cứu công nợ đối tác
] as const;

export type PortalEntitlement = (typeof PORTAL_ENTITLEMENTS)[number];
