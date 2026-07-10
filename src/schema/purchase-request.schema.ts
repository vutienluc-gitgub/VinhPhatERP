import { z } from 'zod';

/* ── Status & Priority enums ── */

export const PR_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'sourcing',
  'fulfilled',
] as const;

export const PR_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

export type PrStatus = (typeof PR_STATUSES)[number];
export type PrPriority = (typeof PR_PRIORITIES)[number];

/* ── Item schema ── */

export const prItemSchema = z.object({
  material_name: z
    .string()
    .min(1, 'Tên vật tư là bắt buộc')
    .max(255, 'Tối đa 255 ký tự'),
  material_specs: z.string().max(500).optional().or(z.literal('')),
  qty_required: z
    .number({ invalid_type_error: 'Số lượng phải là số' })
    .positive('Số lượng phải > 0'),
  uom: z.string().min(1, 'Đơn vị tính là bắt buộc').max(50, 'Tối đa 50 ký tự'),
  expected_date: z.string().optional().or(z.literal('')),
  purpose: z.string().max(500).optional().or(z.literal('')),
});

export type PrItemFormValues = z.infer<typeof prItemSchema>;

/* ── Header schema ── */

export const prHeaderSchema = z.object({
  requester_dept: z
    .string()
    .min(1, 'Bộ phận yêu cầu là bắt buộc')
    .max(100, 'Tối đa 100 ký tự'),
  priority: z.enum(PR_PRIORITIES),
  notes: z.string().max(2000).optional().or(z.literal('')),
  items: z.array(prItemSchema).min(1, 'Phải có ít nhất 1 dòng vật tư'),
});

export type PrHeaderFormValues = z.infer<typeof prHeaderSchema>;

/* ── Defaults ── */

export const prItemDefaults: PrItemFormValues = {
  material_name: '',
  material_specs: '',
  qty_required: 0,
  uom: 'kg',
  expected_date: '',
  purpose: '',
};

export const prHeaderDefaults: PrHeaderFormValues = {
  requester_dept: '',
  priority: 'normal',
  notes: '',
  items: [{ ...prItemDefaults }],
};
