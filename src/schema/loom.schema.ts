import { z } from 'zod';

export const LOOM_TYPES = [
  'rapier',
  'air_jet',
  'water_jet',
  'shuttle',
  'single_jersey',
  'double_jersey',
  'warp_knitting',
  'flat_knitting',
  'accessories',
  'other',
] as const;

export type LoomType = (typeof LOOM_TYPES)[number];

export const LOOM_TYPE_LABELS: Record<LoomType, string> = {
  rapier: 'Rapier (Kim kẹp)',
  air_jet: 'Air Jet (Phun khí)',
  water_jet: 'Water Jet (Phun nước)',
  shuttle: 'Shuttle (Con thoi)',
  single_jersey: 'Single Jersey (Dệt kim 1 mặt)',
  double_jersey: 'Double Jersey (Dệt kim 2 mặt)',
  warp_knitting: 'Warp Knitting (Dệt kim dọc)',
  flat_knitting: 'Flat Knitting (Dệt kim bằng)',
  accessories: 'Accessories (Thiết bị phụ trợ)',
  other: 'Khác',
};

export const LOOM_STATUSES = ['active', 'maintenance', 'inactive'] as const;

export type LoomStatus = (typeof LOOM_STATUSES)[number];

export const LOOM_STATUS_LABELS: Record<LoomStatus, string> = {
  active: 'Hoạt động',
  maintenance: 'Bảo trì',
  inactive: 'Ngừng dùng',
};

export const loomSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Mã máy tối thiểu 2 ký tự')
    .max(50, 'Mã máy tối đa 50 ký tự'),
  name: z
    .string()
    .trim()
    .min(2, 'Tên máy tối thiểu 2 ký tự')
    .max(200, 'Tên máy tối đa 200 ký tự'),
  loom_type: z.enum(LOOM_TYPES),
  supplier_id: z.string().uuid('Chọn nhà dệt'),
  // Thong so van hanh
  max_width_cm: z.number().min(0, 'Kho det >= 0').optional().nullable(),
  max_speed_rpm: z.number().min(0, 'Toc do >= 0').optional().nullable(),
  daily_capacity_m: z.number().min(0, 'Cong suat >= 0').optional().nullable(),
  year_manufactured: z
    .number()
    .int()
    .min(1950, 'Nam >= 1950')
    .max(2100, 'Nam <= 2100')
    .optional()
    .nullable(),
  // Thong so ky thuat (tu catalog nha san xuat)
  diameter_inch: z.number().min(0).optional().nullable(),
  gauge: z.number().int().min(0).optional().nullable(),
  feeders: z.number().int().min(0).optional().nullable(),
  motor_power_kw: z.number().min(0).optional().nullable(),
  voltage: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  weight_kg: z.number().min(0).optional().nullable(),
  status: z.enum(LOOM_STATUSES),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type LoomFormValues = z.infer<typeof loomSchema>;

export const loomDefaultValues: LoomFormValues = {
  code: '',
  name: '',
  loom_type: 'rapier',
  supplier_id: '',
  max_width_cm: null,
  max_speed_rpm: null,
  daily_capacity_m: null,
  year_manufactured: null,
  diameter_inch: null,
  gauge: null,
  feeders: null,
  motor_power_kw: null,
  voltage: '',
  weight_kg: null,
  status: 'active',
  notes: '',
};
