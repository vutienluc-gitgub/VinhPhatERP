import { z } from 'zod';

export const orderRequestItemSchema = z.object({
  fabric_type: z.string().trim().min(2, 'Nhập loại vải'),
  color_name: z.string().trim().optional().or(z.literal('')),
  quantity: z
    .number({ invalid_type_error: 'Nhập số lượng' })
    .min(1, 'Số lượng tối thiểu là 1'),
  unit: z.string().min(1, 'Chọn đơn vị'),
  notes: z.string().trim().optional().or(z.literal('')),
});

export const orderRequestFormSchema = z.object({
  delivery_date: z.string().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
  items: z.array(orderRequestItemSchema).min(1, 'Cần thêm ít nhất 1 mặt hàng'),
});

export type OrderRequestItemFormValues = z.infer<typeof orderRequestItemSchema>;
export type OrderRequestFormValues = z.infer<typeof orderRequestFormSchema>;
