import { z } from 'zod';

export type ShippingRate = {
  id: string;
  name: string;
  destination_area: string;
  rate_per_trip: number | null;
  rate_per_meter: number | null;
  rate_per_kg: number | null;
  loading_fee: number;
  min_charge: number;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ShippingRateFilter = {
  query?: string;
  isActive?: boolean;
};

export const shippingRatesSchema = z.object({
  name: z.string().trim().min(2, 'Tên bảng giá tối thiểu 2 ký tự'),
  destinationArea: z.string().trim().min(1, 'Nhập khu vực giao hàng'),
  ratePerTrip: z.number().min(0, 'Giá phải >= 0').nullable(),
  ratePerMeter: z.number().min(0, 'Giá phải >= 0').nullable(),
  ratePerKg: z.number().min(0, 'Giá phải >= 0').nullable(),
  loadingFee: z.number().min(0, 'Phí bốc xếp phải >= 0'),
  minCharge: z.number().min(0, 'Phí tối thiểu phải >= 0'),
  isActive: z.boolean(),
  notes: z.string().trim().optional().or(z.literal('')),
});

export type ShippingRateFormValues = z.infer<typeof shippingRatesSchema>;

export const shippingRatesDefaultValues: ShippingRateFormValues = {
  name: '',
  destinationArea: '',
  ratePerTrip: null,
  ratePerMeter: null,
  ratePerKg: null,
  loadingFee: 0,
  minCharge: 0,
  isActive: true,
  notes: '',
};
