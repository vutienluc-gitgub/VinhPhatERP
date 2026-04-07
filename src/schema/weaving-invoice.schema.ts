import { z } from 'zod'

export const WEAVING_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  paid: 'Đã thanh toán',
}

export const QUALITY_GRADES = ['A', 'B', 'C'] as const
export const QUALITY_GRADE_LABELS: Record<string, string> = { A: 'Loại A', B: 'Loại B', C: 'Loại C' }

export const weavingRollSchema = z.object({
  roll_number: z.string().trim().min(2, 'Mã cuộn tối thiểu 2 ký tự'),
  weight_kg: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ required_error: 'Nhập khối lượng' }).positive('Phải lớn hơn 0'),
  ),
  length_m: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().positive().optional(),
  ),
  quality_grade: z.enum(['A', 'B', 'C']).optional(),
  warehouse_location: z.string().trim().max(120).optional(),
  lot_number: z.string().trim().max(60).optional(),
  notes: z.string().trim().optional(),
})

export type WeavingRollFormValues = z.infer<typeof weavingRollSchema>

export const weavingInvoiceHeaderSchema = z.object({
  invoice_number: z.string().trim().min(1, 'Số phiếu không được để trống'),
  supplier_id: z.string().uuid('Chọn nhà dệt'),
  invoice_date: z.string().min(1, 'Chọn ngày'),
  fabric_type: z.string().trim().min(1, 'Chọn loại vải'),
  unit_price_per_kg: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
    z.number().min(0, 'Đơn giá không âm'),
  ),
  notes: z.string().trim().optional(),
})

export type WeavingInvoiceHeaderFormValues = z.infer<typeof weavingInvoiceHeaderSchema>

export const weavingInvoiceFormSchema = weavingInvoiceHeaderSchema.extend({
  rolls: z.array(weavingRollSchema).min(1, 'Cần ít nhất 1 cuộn vải'),
})

export type WeavingInvoiceFormValues = z.infer<typeof weavingInvoiceFormSchema>

export const weavingInvoiceDefaults: WeavingInvoiceFormValues = {
  invoice_number: '',
  supplier_id: '',
  invoice_date: new Date().toISOString().slice(0, 10),
  fabric_type: '',
  unit_price_per_kg: 0,
  notes: '',
  rolls: [{
    roll_number: '',
    weight_kg: undefined as unknown as number,
    length_m: undefined,
    quality_grade: undefined,
    warehouse_location: '',
    lot_number: '',
    notes: '',
  }],
}
