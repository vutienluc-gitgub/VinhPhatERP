import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

/* ── Zod schemas ── */

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
})

export type ShippingRateFormValues = z.infer<typeof shippingRatesSchema>

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
}

export const shippingRatesFeature: FeatureDefinition = {
  key: 'shipping-rates',
  route: '/shipping-rates',
  title: 'Giá cước vận chuyển',
  badge: 'New',
  description: 'Quản lý bảng giá cước vận chuyển theo khu vực. Hỗ trợ tính giá cố định/chuyến, theo mét và theo kg.',
  highlights: [
    'Bảng giá cước theo khu vực giao hàng.',
    'Hỗ trợ 3 cách tính: cố định/chuyến, theo mét vải, theo kg.',
    'Phí bốc xếp riêng biệt.',
    'Chỉ admin mới quản lý được bảng giá.',
  ],
  resources: ['Bảng shipping_rates.'],
  entities: ['ShippingRate'],
  nextMilestones: [],
}

/* ── Helpers ── */

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
