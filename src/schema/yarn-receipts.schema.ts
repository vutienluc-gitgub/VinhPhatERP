import { z } from 'zod';

export type DocStatus = 'draft' | 'confirmed' | 'cancelled';

export const DOC_STATUSES = ['draft', 'confirmed', 'cancelled'] as const;

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã huỷ',
};

export const yarnReceiptItemSchema = z.object({
  yarn_catalog_id: z.string().optional().or(z.literal('')),
  yarn_type: z.string().trim().min(2, 'Loại sợi tối thiểu 2 ký tự'),
  color_name: z.string().trim().max(120).optional().or(z.literal('')),
  quantity: z
    .number({ required_error: 'Nhập số lượng' })
    .positive('Số lượng phải > 0'),
  unit_price: z
    .number({ required_error: 'Nhập đơn giá' })
    .min(0, 'Đơn giá >= 0'),
  lot_number: z.string().trim().max(100).optional().or(z.literal('')),
  tensile_strength: z.string().trim().max(50).optional().or(z.literal('')),
  composition: z.string().trim().max(200).optional().or(z.literal('')),
  origin: z.string().trim().max(100).optional().or(z.literal('')),
});

export type YarnReceiptItemFormValues = z.infer<typeof yarnReceiptItemSchema>;

export const yarnReceiptsSchema = z.object({
  receipt_number: z.string().trim().optional().default(''),
  supplier_id: z.string().uuid('Chọn nhà cung cấp'),
  receipt_date: z.string().trim().min(1, 'Chọn ngày nhập'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(yarnReceiptItemSchema).min(1, 'Phải có ít nhất 1 dòng hàng'),
});

export type YarnReceiptsFormValues = z.infer<typeof yarnReceiptsSchema>;

export const emptyYarnReceiptItem: YarnReceiptItemFormValues = {
  yarn_catalog_id: '',
  yarn_type: '',
  color_name: '',
  quantity: 0,
  unit_price: 0,
  lot_number: '',
  tensile_strength: '',
  composition: '',
  origin: '',
};

export const yarnReceiptsDefaultValues: YarnReceiptsFormValues = {
  receipt_number: '',
  supplier_id: '',
  receipt_date: new Date().toISOString().slice(0, 10),
  notes: '',
  items: [{ ...emptyYarnReceiptItem }],
};
