import { z } from 'zod';

export const RFQ_STATUSES = [
  'open',
  'closing_soon',
  'closed',
  'awarded',
] as const;

export type RfqStatus = (typeof RFQ_STATUSES)[number];

/* ── RFQ Form Schema ── */

export const rfqItemMappingSchema = z.object({
  pr_item_id: z.string().uuid(),
  material_id: z.string().min(1, 'Bắt buộc chọn mã vật tư'),
});

export const rfqSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc').max(255, 'Tối đa 255 ký tự'),
  deadline_date: z.string().min(1, 'Hạn chót báo giá là bắt buộc'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  items: z
    .array(rfqItemMappingSchema)
    .min(1, 'Phải chọn ít nhất 1 dòng vật tư từ PR'),
});

export type RfqItemMappingValues = z.infer<typeof rfqItemMappingSchema>;
export type RfqFormValues = z.infer<typeof rfqSchema>;

export const rfqDefaults: RfqFormValues = {
  title: '',
  deadline_date: '',
  notes: '',
  items: [],
};
