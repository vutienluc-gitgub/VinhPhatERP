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
  is_active?: boolean;
};

export const shippingRatesSchema = z.object({
  name: z.string().trim().min(2, 'Tên bảng giá tối thiểu 2 ký tự'),
  destination_area: z.string().trim().min(1, 'Nhập khu vực giao hàng'),
  rate_per_trip: z.number().min(0, 'Giá phải >= 0').nullable(),
  rate_per_meter: z.number().min(0, 'Giá phải >= 0').nullable(),
  rate_per_kg: z.number().min(0, 'Giá phải >= 0').nullable(),
  loading_fee: z.number().min(0, 'Phí bốc xếp phải >= 0'),
  min_charge: z.number().min(0, 'Phí tối thiểu phải >= 0'),
  is_active: z.boolean(),
  notes: z.string().trim().optional().or(z.literal('')),
});

export type ShippingRateFormValues = z.infer<typeof shippingRatesSchema>;

export const shippingRatesDefaultValues: ShippingRateFormValues = {
  name: '',
  destination_area: '',
  rate_per_trip: null,
  rate_per_meter: null,
  rate_per_kg: null,
  loading_fee: 0,
  min_charge: 0,
  is_active: true,
  notes: '',
};
