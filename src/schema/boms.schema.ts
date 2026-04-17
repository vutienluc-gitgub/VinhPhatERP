import { z } from 'zod';

export const BOM_STATUSES = ['draft', 'approved', 'deprecated'] as const;
export type BomStatus = (typeof BOM_STATUSES)[number];

export const BOM_STATUS_LABELS: Record<BomStatus, string> = {
  draft: 'Bản Nháp',
  approved: 'Đã Duyệt',
  deprecated: 'Ngừng Áp Dụng',
};

export const BOM_STATUS_COLORS: Record<BomStatus, string> = {
  draft: 'slate',
  approved: 'green',
  deprecated: 'red',
};

export const bomYarnItemSchema = z.object({
  id: z.string().optional(),
  yarn_catalog_id: z
    .string({ required_error: 'Vui lòng chọn loại sợi' })
    .min(1, 'Vui lòng chọn loại sợi'),
  ratio_pct: z
    .number()
    .min(0.01, 'Tỉ lệ phải lớn hơn 0')
    .max(100, 'Tỉ lệ không được quá 100%'),
  consumption_kg_per_m: z.number().min(0.0001, 'Tiêu hao phải lớn hơn 0'),
  notes: z.string().nullable().optional(),
  sort_order: z.number().default(0),
});

export const bomTemplateSchema = z.object({
  code: z.string().optional().default(''),
  name: z.string().min(1, 'Vui lòng nhập tên BOM'),
  target_fabric_id: z
    .string({ required_error: 'Vui lòng chọn mã vải mộc mục tiêu' })
    .min(1, 'Vui lòng chọn mã vải mộc mục tiêu'),
  target_width_cm: z.number().nullable().optional(),
  target_gsm: z.number().nullable().optional(),
  standard_loss_pct: z
    .number()
    .min(0, 'Hao hụt không được âm')
    .max(100, 'Hao hụt không được quá 100%')
    .default(5),
  notes: z.string().nullable().optional(),
  bom_yarn_items: z
    .array(bomYarnItemSchema)
    .min(1, 'BOM phải có ít nhất 1 loại nguyên liệu sợi')
    .superRefine((items, ctx) => {
      const yarnIds = items.map((item) => item.yarn_catalog_id);
      const duplicates = yarnIds.filter((id, i) => yarnIds.indexOf(id) !== i);
      if (duplicates.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Không được chọn trùng lặp loại sợi trong cùng một BOM',
        });
      }

      const totalRatio = items.reduce(
        (sum, item) => sum + (item.ratio_pct || 0),
        0,
      );
      if (Math.abs(totalRatio - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tổng tỉ lệ của tất cả nguyên liệu phải bằng 100% (hiện tại: ${totalRatio.toFixed(2)}%)`,
        });
      }
    }),
});

export type BomTemplateFormData = z.infer<typeof bomTemplateSchema>;
