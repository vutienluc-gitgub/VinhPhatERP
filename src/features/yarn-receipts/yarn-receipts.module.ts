import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'
import type { DocStatus } from './types'

/* ── Status labels ── */

export const DOC_STATUSES = ['draft', 'confirmed', 'cancelled'] as const

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã huỷ',
}

/* ── Zod schemas ── */

export const yarnReceiptItemSchema = z.object({
  yarnCatalogId: z.string().optional().or(z.literal('')),
  yarnType: z.string().trim().min(2, 'Loại sợi tối thiểu 2 ký tự'),
  colorName: z.string().trim().max(120).optional().or(z.literal('')),
  quantity: z.number({ required_error: 'Nhập số lượng' }).positive('Số lượng phải > 0'),
  unitPrice: z.number({ required_error: 'Nhập đơn giá' }).min(0, 'Đơn giá >= 0'),
  lotNumber: z.string().trim().max(100).optional().or(z.literal('')),
  tensileStrength: z.string().trim().max(50).optional().or(z.literal('')),
  composition: z.string().trim().max(200).optional().or(z.literal('')),
  origin: z.string().trim().max(100).optional().or(z.literal('')),
})

export type YarnReceiptItemFormValues = z.infer<typeof yarnReceiptItemSchema>

export const yarnReceiptsSchema = z.object({
  receiptNumber: z.string().trim().min(3, 'Số phiếu tối thiểu 3 ký tự'),
  supplierId: z.string().uuid('Chọn nhà cung cấp'),
  receiptDate: z.string().trim().min(1, 'Chọn ngày nhập'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(yarnReceiptItemSchema).min(1, 'Phải có ít nhất 1 dòng hàng'),
})

export type YarnReceiptsFormValues = z.infer<typeof yarnReceiptsSchema>

export const emptyItem: YarnReceiptItemFormValues = {
  yarnCatalogId: '',
  yarnType: '',
  colorName: '',
  quantity: 0,
  unitPrice: 0,
  lotNumber: '',
  tensileStrength: '',
  composition: '',
  origin: '',
}

export const yarnReceiptsDefaultValues: YarnReceiptsFormValues = {
  receiptNumber: '',
  supplierId: '',
  receiptDate: new Date().toISOString().slice(0, 10),
  notes: '',
  items: [{ ...emptyItem }],
}

/* ── Feature definition ── */

export const yarnReceiptsFeature: FeatureDefinition = {
  key: 'yarn-receipts',
  route: '/yarn-receipts',
  title: 'Nhập sợi',
  badge: 'Active',
  description:
    'Module đầu chuỗi nghiệp vụ — ghi nhận phiếu nhập sợi từ nhà cung cấp.',
  summary: [
    { label: 'Loại chứng từ', value: 'Receipt' },
    { label: 'Mobile form', value: '1 flow' },
    { label: 'Offline draft', value: 'Planned' },
  ],
  highlights: [
    'Form mobile-first, nhập nhanh số lượng và đơn giá.',
    'Line items cho từng lô sợi.',
    'Sinh movement in cho kho nguyên liệu.',
  ],
  resources: [
    'Bảng yarn_receipts và yarn_receipt_items.',
    'Validation số lượng, giá và nhà cung cấp.',
    'Autosave draft và retry khi offline.',
  ],
  entities: ['Receipt header', 'Receipt item', 'Supplier', 'Inventory movement'],
  nextMilestones: [
    'Tạo receipt list theo ngày và supplier.',
    'Thêm line item repeater với totals realtime.',
    'Ghi inventory movement sau khi confirm.',
  ],
}