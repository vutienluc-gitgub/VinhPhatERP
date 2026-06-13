import { z } from 'zod';

export const FABRIC_CATALOG_STATUSES = ['active', 'inactive'] as const;
export const FABRIC_CATALOG_STATUS_LABELS: Record<
  'active' | 'inactive',
  string
> = {
  active: 'Đang dùng',
  inactive: 'Ngưng dùng',
};

const baseFabricCatalogSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Mã tối thiểu 2 ký tự')
    .max(50, 'Mã tối đa 50 ký tự'),
  name: z
    .string()
    .trim()
    .min(2, 'Tên tối thiểu 2 ký tự')
    .max(200, 'Tên tối đa 200 ký tự'),
  composition: z.string().trim().max(200).optional().or(z.literal('')),
  composition_tags: z.array(z.string()).default([]),
  unit: z.string().trim().min(1, 'Chọn đơn vị').max(20).default('kg'),
  category_id: z.string().uuid('Chọn danh mục hợp lệ').optional().nullable(),
  target_width_cm: z.number().min(0).optional().nullable(),
  target_gsm: z.number().min(0).optional().nullable(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  status: z.enum(FABRIC_CATALOG_STATUSES),
  image_url: z.string().url().nullable().optional(),
  specifications: z.record(z.unknown()).optional().nullable(),
  is_public: z.boolean().default(false),
  slug: z.string().trim().max(100).optional().or(z.literal('')),
  color: z.string().trim().max(100).optional().nullable(),
  color_tags: z.array(z.string()).default([]),
  technique: z.string().trim().max(100).optional().nullable(),
});

export const fabricCatalogSchema = z.discriminatedUnion('fabric_type', [
  baseFabricCatalogSchema.extend({
    fabric_type: z.literal('knitted'),
    gauge: z.number().min(0, 'Gauge không hợp lệ').optional().nullable(),
    diameter: z.number().min(0, 'Diameter không hợp lệ').optional().nullable(),
    machine_type: z.string().trim().max(100).optional().nullable(),
    needle_count: z.number().min(0).optional().nullable(),
  }),
  baseFabricCatalogSchema.extend({
    fabric_type: z.literal('woven'),
    warp_count: z.string().trim().max(50).optional().nullable(),
    weft_count: z.string().trim().max(50).optional().nullable(),
    epi: z.number().min(0).optional().nullable(),
    ppi: z.number().min(0).optional().nullable(),
    weave_pattern: z.string().trim().max(100).optional().nullable(),
  }),
]);

export type FabricCatalogFormValues = z.infer<typeof fabricCatalogSchema>;

export const fabricCatalogDefaultValues: FabricCatalogFormValues = {
  fabric_type: 'knitted',
  code: '',
  name: '',
  composition: '',
  composition_tags: [],
  target_width_cm: null,
  target_gsm: null,
  category_id: null,
  unit: 'kg',
  notes: '',
  status: 'active',
  image_url: null,
  specifications: {},
  gauge: null,
  diameter: null,
  machine_type: null,
  needle_count: null,
  is_public: false,
  slug: '',
  color: null,
  color_tags: [],
  technique: null,
};
