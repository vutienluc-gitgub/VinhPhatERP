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
  b2b_planner: z
    .object({
      minimum_order_qty_kg: z.number().min(0).default(100),
      lead_time_days: z.number().min(0).default(7),
      production_capacity_monthly_tons: z.number().min(0).default(20),
      yield_factor: z.number().min(0.5).max(2.0).default(1.0),
      public_stock_display: z
        .enum(['none', 'status', 'quantity'])
        .default('status'),
      trust_has_sample: z.boolean().default(false),
      trust_fast_delivery: z.boolean().default(false),
      trust_tech_support: z.boolean().default(false),
      standard_consumption_kg: z.number().min(0.05).max(2.0).default(0.25),
      origin_country: z.string().trim().max(100).optional().nullable(),
    })
    .optional(),
  pricing_tiers: z
    .array(
      z.object({
        min_quantity: z.number().min(0, 'Số lượng tối thiểu phải >= 0'),
        max_quantity: z.number().nullable().optional(),
        unit_price: z.number().min(0, 'Đơn giá phải >= 0'),
        currency: z.string().default('VND'),
        display_label: z.string().nullable().optional(),
        is_public_visible: z.boolean().default(true),
        priority: z.number().int().default(0),
        customer_group_ids: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  images: z
    .array(
      z.object({
        id: z.string().uuid().or(z.literal('')),
        variant_id: z.string().nullable().optional(),
        application_id: z.string().nullable().optional(),
        type: z.enum([
          'SWATCH',
          'SURFACE',
          'BACK',
          'STRETCH',
          'APPLICATION',
          'COMPOSITION',
          'CERTIFICATE',
        ]),
        image_url: z.string().url(),
        alt_text: z.string().nullable().optional(),
        caption: z.string().nullable().optional(),
        is_primary: z.boolean().optional(),
        display_order: z.number().default(0),
      }),
    )
    .default([]),
});

const fabricCatalogUnion = z.discriminatedUnion('fabric_type', [
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

export const fabricCatalogSchema = fabricCatalogUnion.superRefine(
  (data, ctx) => {
    const moq = data.b2b_planner?.minimum_order_qty_kg ?? 0;
    const tiers = data.pricing_tiers ?? [];

    if (tiers.length === 0 || moq <= 0) return;

    // Sort tiers by min_quantity for overlap detection
    const sorted = tiers
      .map((t, i) => ({ ...t, originalIndex: i }))
      .sort((a, b) => a.min_quantity - b.min_quantity);

    sorted.forEach((tier, sortedIdx) => {
      // MOQ alignment: only for public tiers
      if (tier.is_public_visible && tier.min_quantity < moq) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Số lượng tối thiểu (${tier.min_quantity} kg) không được nhỏ hơn MOQ (${moq} kg)`,
          path: ['pricing_tiers', tier.originalIndex, 'min_quantity'],
        });
      }

      // Overlap detection: min_quantity of tier N must be > max_quantity of tier N-1 for same customer group
      if (sortedIdx > 0) {
        for (let j = 0; j < sortedIdx; j++) {
          const prevTier = sorted[j];
          if (
            prevTier !== undefined &&
            prevTier.max_quantity !== null &&
            prevTier.max_quantity !== undefined &&
            tier.min_quantity <= prevTier.max_quantity
          ) {
            // Check if they share any customer group or both are general
            const groupsI = tier.customer_group_ids || [];
            const groupsJ = prevTier.customer_group_ids || [];
            const hasCommonGroup = groupsI.some((id) => groupsJ.includes(id));
            const bothGeneral = groupsI.length === 0 && groupsJ.length === 0;

            if (bothGeneral || hasCommonGroup) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Bậc giá bị trùng lắp phạm vi số lượng với bậc giá có cùng đối tượng nhóm (từ ${tier.min_quantity} kg trùng với bậc ${prevTier.min_quantity}-${prevTier.max_quantity} kg)`,
                path: ['pricing_tiers', tier.originalIndex, 'min_quantity'],
              });
              break; // Only trigger one overlap error per tier
            }
          }
        }
      }
    });
  },
);

export type FabricCatalogFormValues = z.infer<typeof fabricCatalogUnion>;

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
  b2b_planner: {
    minimum_order_qty_kg: 100,
    lead_time_days: 7,
    production_capacity_monthly_tons: 20,
    yield_factor: 1.0,
    public_stock_display: 'status',
    trust_has_sample: false,
    trust_fast_delivery: false,
    trust_tech_support: false,
    standard_consumption_kg: 0.25,
    origin_country: null,
  },
  pricing_tiers: [],
  images: [],
};
