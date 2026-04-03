import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'
import type { DiscountType, QuotationStatus } from './types'

/* ── Status labels ── */

export const QUOTATION_STATUSES = [
  'draft', 'sent', 'confirmed', 'rejected', 'expired', 'converted',
] as const

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Nháp',
  sent: 'Đã gửi',
  confirmed: 'Đã duyệt',
  rejected: 'Từ chối',
  expired: 'Hết hạn',
  converted: 'Đã chuyển ĐH',
}

export const QUOTATION_STATUS_ICONS: Record<QuotationStatus, string> = {
  draft: '📝',
  sent: '📤',
  confirmed: '✅',
  rejected: '❌',
  expired: '⏰',
  converted: '🔄',
}

/* ── Discount type labels ── */

export const DISCOUNT_TYPE_OPTIONS: { value: DiscountType; label: string }[] = [
  { value: 'percent', label: '% Phần trăm' },
  { value: 'amount', label: 'Tiền cố định (đ)' },
]

/* ── VAT options ── */

export const VAT_RATE_OPTIONS = [
  { value: 0, label: '0% (Không VAT)' },
  { value: 5, label: '5%' },
  { value: 8, label: '8%' },
  { value: 10, label: '10%' },
] as const

/* ── Units ── */

export const UNIT_OPTIONS = [
  { value: 'm', label: 'Mét (m)' },
  { value: 'kg', label: 'Kg' },
] as const

export type UnitType = (typeof UNIT_OPTIONS)[number]['value']

/* ── Zod schemas ── */

export const quotationItemSchema = z.object({
  fabricType: z.string().trim().min(2, 'Loại vải tối thiểu 2 ký tự'),
  colorName: z.string().trim().max(120).optional().or(z.literal('')),
  colorCode: z.string().trim().max(20).optional().or(z.literal('')),
  widthCm: z.number().min(0).optional().or(z.literal(0)),
  unit: z.enum(['m', 'kg']).default('m'),
  quantity: z.number({ required_error: 'Nhập số lượng' }).positive('Số lượng phải > 0'),
  unitPrice: z.number({ required_error: 'Nhập đơn giá' }).min(0, 'Đơn giá >= 0'),
  leadTimeDays: z.number().int().min(0).optional().or(z.literal(0)),
  notes: z.string().trim().max(300).optional().or(z.literal('')),
})

export type QuotationItemFormValues = z.infer<typeof quotationItemSchema>

export const quotationsSchema = z.object({
  quotationNumber: z.string().trim().min(3, 'Số báo giá tối thiểu 3 ký tự'),
  customerId: z.string().uuid('Chọn khách hàng'),
  quotationDate: z.string().trim().min(1, 'Chọn ngày báo giá'),
  validUntil: z.string().trim().optional().or(z.literal('')),
  discountType: z.enum(['percent', 'amount']).default('percent'),
  discountValue: z.number().min(0, 'Chiết khấu >= 0').default(0),
  vatRate: z.number().min(0).max(100).default(10),
  deliveryTerms: z.string().trim().max(1000).optional().or(z.literal('')),
  paymentTerms: z.string().trim().max(1000).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(quotationItemSchema).min(1, 'Phải có ít nhất 1 dòng hàng'),
}).refine(
  (data) => {
    if (!data.validUntil) return true
    return data.validUntil >= data.quotationDate
  },
  { message: 'Ngày hết hạn phải sau ngày báo giá', path: ['validUntil'] },
)

export type QuotationsFormValues = z.infer<typeof quotationsSchema>

export const emptyQuotationItem: QuotationItemFormValues = {
  fabricType: '',
  colorName: '',
  colorCode: '',
  widthCm: 0,
  unit: 'm',
  quantity: 0,
  unitPrice: 0,
  leadTimeDays: 0,
  notes: '',
}

export const quotationsDefaultValues: QuotationsFormValues = {
  quotationNumber: '',
  customerId: '',
  quotationDate: new Date().toISOString().slice(0, 10),
  validUntil: '',
  discountType: 'percent',
  discountValue: 0,
  vatRate: 10,
  deliveryTerms: '',
  paymentTerms: '',
  notes: '',
  items: [{ ...emptyQuotationItem }],
}

/* ── Calculation helpers ── */

export function calculateQuotationTotals(
  items: QuotationItemFormValues[],
  discountType: DiscountType,
  discountValue: number,
  vatRate: number,
) {
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  )

  let discountAmount = 0
  if (discountType === 'percent') {
    discountAmount = Math.round(subtotal * (discountValue / 100))
  } else {
    discountAmount = discountValue
  }

  const totalBeforeVat = subtotal - discountAmount
  const vatAmount = Math.round(totalBeforeVat * (vatRate / 100))
  const totalAmount = totalBeforeVat + vatAmount

  return { subtotal, discountAmount, totalBeforeVat, vatAmount, totalAmount }
}

/* ── Feature definition ── */

export const quotationsFeature: FeatureDefinition = {
  key: 'quotations',
  route: '/quotations',
  title: 'Báo giá',
  badge: 'New',
  description:
    'Quản lý báo giá khách hàng với VAT, chiết khấu, revision và chuyển đổi sang đơn hàng.',
  summary: [
    { label: 'Status set', value: '6' },
    { label: 'VAT', value: 'Có' },
    { label: 'Chiết khấu', value: 'Có' },
  ],
  highlights: [
    'Tạo báo giá với nhiều dòng hàng, VAT và chiết khấu.',
    'Theo dõi revision khi khách yêu cầu sửa đổi.',
    'Chuyển đổi báo giá đã duyệt thành đơn hàng 1 click.',
    'Cảnh báo báo giá sắp/đã hết hiệu lực.',
  ],
  resources: [
    'Bảng quotations và quotation_items.',
    'UI list, detail, form, print.',
    'Hook chuyển đổi sang đơn hàng.',
  ],
  entities: ['Quotation header', 'Quotation item', 'Revision', 'Conversion'],
  nextMilestones: [
    'Bản in PDF báo giá.',
    'Gửi báo giá qua email/Zalo.',
    'Báo cáo tỷ lệ chuyển đổi.',
  ],
}
