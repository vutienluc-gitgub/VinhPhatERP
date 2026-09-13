import { z } from 'zod';

export type TripStatus =
  | 'draft'
  | 'assigned'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Bản nháp',
  assigned: 'Đã phân công',
  in_transit: 'Đang vận chuyển',
  completed: 'Hoàn thành chuyến',
  cancelled: 'Đã hủy',
};

export const TRIP_STATUS_BADGE_VARIANTS: Record<
  TripStatus,
  'gray' | 'info' | 'warning' | 'success' | 'danger'
> = {
  draft: 'gray',
  assigned: 'info',
  in_transit: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export type StopStatus =
  | 'pending'
  | 'arrived'
  | 'completed'
  | 'failed'
  | 'skipped';

export const STOP_STATUS_LABELS: Record<StopStatus, string> = {
  pending: 'Chờ giao',
  arrived: 'Đã đến nơi',
  completed: 'Đã nhận hàng',
  failed: 'Giao thất bại',
  skipped: 'Bỏ qua điểm',
};

export const deliveryTripSchema = z.object({
  tripNumber: z.string().trim().min(1, 'Nhập mã chuyến xe'),
  driverId: z.string().uuid().optional().nullable(),
  vehiclePlate: z.string().trim().min(1, 'Nhập biển số xe'),
  maxPayloadKg: z.number().min(0).optional().nullable(),
  plannedStartAt: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type DeliveryTripFormValues = z.infer<typeof deliveryTripSchema>;

export const deliveryTripStopSchema = z.object({
  tripId: z.string().uuid(),
  shipmentId: z.string().uuid(),
  stopSequence: z.number().int().min(1),
  estimatedArrival: z.string().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export type DeliveryTripStopFormValues = z.infer<typeof deliveryTripStopSchema>;

export const podEvidenceSchema = z.object({
  shipmentId: z.string().uuid(),
  tripId: z.string().uuid().optional().nullable(),
  receiverName: z.string().trim().min(1, 'Nhập tên người nhận'),
  receiverPhone: z.string().trim().optional().nullable(),
  signatureImageUrl: z.string().min(1, 'Bắt buộc chữ ký nhận hàng'),
  evidencePhotos: z.array(z.string()).default([]),
  geoLatitude: z.number().optional().nullable(),
  geoLongitude: z.number().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export type PodEvidenceFormValues = z.infer<typeof podEvidenceSchema>;
