import { z } from 'zod';

export const supplierQuoteItemSchema = z.object({
  rfq_item_id: z.string().uuid(),
  unit_price: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => Number(v) || 0),
  qty_offered: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => Number(v) || 0),
  notes: z.string().optional(),
});

export const supplierQuoteSchema = z.object({
  supplierName: z.string().min(2, 'Vui lòng nhập Tên công ty/Cá nhân hợp lệ'),
  supplierPhone: z.string().min(9, 'Vui lòng nhập Số điện thoại hợp lệ'),
  notes: z.string().optional(),
  items: z
    .array(supplierQuoteItemSchema)
    .min(1, 'Vui lòng nhập báo giá cho ít nhất 1 vật tư'),
});

export type SupplierQuoteFormValues = z.infer<typeof supplierQuoteSchema>;
