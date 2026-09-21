import { z } from 'zod';

export const BOM_STATUSES = ['draft', 'approved', 'active', 'archived'] as const;

export const BOM_STATUS_LABELS: Record<string, string> = {
  draft: 'Bản nháp',
  approved: 'Đã duyệt',
  active: 'Đang áp dụng',
  archived: 'Lưu trữ',
};

export const BOM_STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  approved: 'blue',
  active: 'green',
  archived: 'gray',
};

export const bomYarnItemSchema = z.object({
  yarn_id: z.string(),
  yarn_name: z.string().optional(),
  ratio: z.number().min(0).max(100),
  loss_percentage: z.number().optional().default(3),
});

export const bomTemplateSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Mã định mức là bắt buộc'),
  fabric_id: z.string().min(1, 'Vui lòng chọn mẫu vải'),
  name: z.string().min(1, 'Tên định mức là bắt buộc'),
  status: z.enum(BOM_STATUSES).default('draft'),
  items: z.array(bomYarnItemSchema).default([]),
  notes: z.string().optional(),
});

export type BomTemplate = z.infer<typeof bomTemplateSchema>;
export type BomYarnItem = z.infer<typeof bomYarnItemSchema>;

export default bomTemplateSchema;
