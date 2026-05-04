import { z } from 'zod';

export const poItemSchema = z.object({
  id: z.string().optional(),
  material_id: z.string().min(1, 'Vui lòng chọn nguyên liệu'),
  uom: z.enum(['kg', 'cây', 'mét', 'cuộn'], {
    required_error: 'Vui lòng chọn đơn vị',
  }),
  ordered_qty: z.number().positive('Số lượng phải lớn hơn 0'),
  unit_price: z.number().min(0, 'Đơn giá không được âm'),
});

export const purchaseOrderFormSchema = z.object({
  supplier_id: z.string().min(1, 'Vui lòng chọn nhà cung cấp'),
  supplier_name_snapshot: z
    .string()
    .min(1, 'Vui lòng chọn nhà cung cấp để lấy tên'),
  order_date: z.string().min(1, 'Vui lòng chọn ngày đặt hàng'),
  expected_date: z.string().optional().nullable(),
  items: z.array(poItemSchema).min(1, 'Cần ít nhất một dòng hàng'),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

export const goodsReceiptItemSchema = z
  .object({
    po_item_id: z.string(),
    received_qty: z.number().positive('Số lượng thực nhận phải lớn hơn 0'),
    unit_price: z.number(),
    remaining_qty: z.number(),
  })
  .refine((data) => data.received_qty <= data.remaining_qty, {
    message: 'Số lượng thực nhận không được vượt quá số lượng còn lại',
    path: ['received_qty'],
  });

export const goodsReceiptFormSchema = z.object({
  po_id: z.string(),
  received_date: z.string().min(1, 'Vui lòng chọn ngày nhập'),
  items: z
    .array(goodsReceiptItemSchema)
    .min(1, 'Cần ít nhất một dòng nhập kho'),
});

export type GoodsReceiptFormValues = z.infer<typeof goodsReceiptFormSchema>;

export const poApproveSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    rejection_reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.action === 'reject' &&
        (!data.rejection_reason || data.rejection_reason.trim() === '')
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Vui lòng nhập lý do từ chối',
      path: ['rejection_reason'],
    },
  );
