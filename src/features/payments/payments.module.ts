import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'
import type { PaymentMethod } from './types'

/* ── Constants ── */

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  check: 'Séc',
  other: 'Khác',
}

/* ── Zod schemas ── */

export const paymentsSchema = z.object({
  paymentNumber: z.string().trim().min(3, 'Nhập số phiếu thu'),
  orderId: z.string().uuid('Chọn đơn hàng'),
  customerId: z.string().uuid('Chọn khách hàng'),
  paymentDate: z.string().trim().min(1, 'Chọn ngày thu'),
  amount: z.number().positive('Số tiền phải > 0'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'other']),
  referenceNumber: z.string().trim().max(120).optional().or(z.literal('')),
})

export type PaymentsFormValues = z.infer<typeof paymentsSchema>

export const paymentsDefaultValues: PaymentsFormValues = {
  paymentNumber: '',
  orderId: '',
  customerId: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  paymentMethod: 'bank_transfer',
  referenceNumber: '',
}

export const paymentsFeature: FeatureDefinition = {
  key: 'payments',
  route: '/payments',
  title: 'Thu tiền',
  badge: 'Scaffolded',
  description:
    'Payments theo dõi công nợ, lịch sử thu tiền và payment status theo order hoặc shipment.',
  highlights: [
    'Input số tiền tối ưu cho mobile keypad.',
    'Cho phép đối chiếu đã thu và còn nợ.',
    'Gắn với khách hàng và shipment liên quan.',
  ],
  resources: [
    'Bang payments.',
    'Widget cong no va lich su giao dich.',
    'Rule cap nhat paid amount tren order.',
  ],
  entities: ['Payment receipt', 'Debt balance', 'Method', 'Reference'],
  nextMilestones: [
    'Tao quick receive flow tu order detail.',
    'Hien balance due theo customer va order.',
    'Them overdue debt dashboard cho sales.',
  ],
}