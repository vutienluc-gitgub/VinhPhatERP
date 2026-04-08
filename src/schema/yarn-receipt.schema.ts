import { z } from 'zod';

export type DocStatus = 'draft' | 'confirmed' | 'cancelled';

export const DOC_STATUSES = ['draft', 'confirmed', 'cancelled'] as const;

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã huỷ',
};

export const yarnReceiptItemSchema = z.object({
  yarnCatalogId: z.string().optional().or(z.literal('')),
  yarnType: z.string().trim().min(2, 'Loại sợi tối thiểu 2 ký tự'),
  colorName: z.string().trim().max(120).optional().or(z.literal('')),
  quantity: z
    .number({ required_error: 'Nhập số lượng' })
    .positive('Số lượng phải > 0'),
  unitPrice: z
    .number({ required_error: 'Nhập đơn giá' })
    .min(0, 'Đơn giá >= 0'),
  lotNumber: z.string().trim().max(100).optional().or(z.literal('')),
  tensileStrength: z.string().trim().max(50).optional().or(z.literal('')),
  composition: z.string().trim().max(200).optional().or(z.literal('')),
  origin: z.string().trim().max(100).optional().or(z.literal('')),
});

export type YarnReceiptItemFormValues = z.infer<typeof yarnReceiptItemSchema>;

export const yarnReceiptsSchema = z.object({
  receiptNumber: z.string().trim().min(3, 'Số phiếu tối thiểu 3 ký tự'),
  supplierId: z.string().uuid('Chọn nhà cung cấp'),
  receiptDate: z.string().trim().min(1, 'Chọn ngày nhập'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(yarnReceiptItemSchema).min(1, 'Phải có ít nhất 1 dòng hàng'),
});

export type YarnReceiptsFormValues = z.infer<typeof yarnReceiptsSchema>;

export const emptyYarnReceiptItem: YarnReceiptItemFormValues = {
  yarnCatalogId: '',
  yarnType: '',
  colorName: '',
  quantity: 0,
  unitPrice: 0,
  lotNumber: '',
  tensileStrength: '',
  composition: '',
  origin: '',
};

export const yarnReceiptsDefaultValues: YarnReceiptsFormValues = {
  receiptNumber: '',
  supplierId: '',
  receiptDate: new Date().toISOString().slice(0, 10),
  notes: '',
  items: [{ ...emptyYarnReceiptItem }],
};
