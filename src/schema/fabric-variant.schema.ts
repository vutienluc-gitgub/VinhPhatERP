import { z } from 'zod';

/* ─── Constants ─── */

export const FABRIC_VARIANT_STATUSES = [
  'active',
  'draft',
  'discontinued',
] as const;

export const FABRIC_VARIANT_STATUS_LABELS: Record<
  (typeof FABRIC_VARIANT_STATUSES)[number],
  string
> = {
  active: 'Đang dùng',
  draft: 'Bản nháp',
  discontinued: 'Ngưng sản xuất',
};

export const FABRIC_UOM_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'meter', label: 'Mét (m)' },
  { value: 'yard', label: 'Yard (yd)' },
] as const;

export const FABRIC_BASE_UOMS = ['meter', 'yard', 'kg'] as const;

/* ─── Schema ─── */

export const fabricVariantSchema = z.object({
  /* Identity — variant_code is auto-generated */
  color_name: z
    .string()
    .trim()
    .min(1, 'Tên màu không được bỏ trống')
    .max(100, 'Tên màu tối đa 100 ký tự'),
  color_hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Mã hex không hợp lệ (VD: #000000)')
    .nullable()
    .optional()
    .or(z.literal('')),

  /* Level 1: Quy cách thực tế */
  actual_width_cm: z.number().min(0, 'Khổ phải >= 0').nullable().optional(),
  actual_gsm: z.number().min(0, 'GSM phải >= 0').nullable().optional(),
  shrinkage_rate_warp: z
    .number()
    .min(0, 'Phải >= 0')
    .max(100, 'Phải <= 100')
    .nullable()
    .optional(),
  shrinkage_rate_weft: z
    .number()
    .min(0, 'Phải >= 0')
    .max(100, 'Phải <= 100')
    .nullable()
    .optional(),

  /* Level 2: Kho & Đơn vị tính */
  base_uom: z.enum(FABRIC_BASE_UOMS).default('kg'),
  conversion_rate: z.number().min(0).nullable().optional(),

  /* Level 3: Truy xuất nguồn */
  lot_number: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional()
    .or(z.literal('')),
  supplier_id: z.string().uuid().nullable().optional(),
  sku: z.string().trim().max(100).nullable().optional().or(z.literal('')),
  barcode: z.string().trim().max(100).nullable().optional().or(z.literal('')),
  moq: z.number().min(0, 'MOQ phải >= 0').nullable().optional(),

  /* Pricing */
  purchase_price: z.number().min(0).nullable().optional(),
  selling_price: z.number().min(0).nullable().optional(),

  /* Metadata */
  status: z.enum(FABRIC_VARIANT_STATUSES).default('active'),
  is_public: z.boolean().default(false),
  image_url: z.string().url().nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional().or(z.literal('')),
});

export type FabricVariantFormValues = z.infer<typeof fabricVariantSchema>;

export const fabricVariantDefaultValues: FabricVariantFormValues = {
  color_name: '',
  color_hex: null,
  actual_width_cm: null,
  actual_gsm: null,
  shrinkage_rate_warp: null,
  shrinkage_rate_weft: null,
  base_uom: 'kg',
  conversion_rate: null,
  lot_number: null,
  supplier_id: null,
  sku: null,
  barcode: null,
  moq: null,
  purchase_price: null,
  selling_price: null,
  status: 'active',
  is_public: false,
  image_url: null,
  notes: null,
};
