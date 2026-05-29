import { z } from 'zod';

export const LOOM_TYPES = [
  'single_jersey',
  'double_jersey',
  'rib',
  'interlock',
  'terry',
  'jacquard',
  'open_width',
  'flat_knitting',
  'warp_knitting',
  'rapier',
  'air_jet',
  'water_jet',
  'shuttle',
  'accessories',
  'other',
] as const;

export type LoomType = (typeof LOOM_TYPES)[number];

export const LOOM_TYPE_LABELS: Record<LoomType, string> = {
  single_jersey: 'Single Jersey',
  double_jersey: 'Double Jersey',
  rib: 'Rib',
  interlock: 'Interlock',
  terry: 'Terry (Khăn/Nỉ)',
  jacquard: 'Jacquard',
  open_width: 'Open Width (Cắt màng)',
  flat_knitting: 'Flat Knitting (Bo/Cổ)',
  warp_knitting: 'Warp Knitting',
  rapier: 'Rapier (Kim kẹp)',
  air_jet: 'Air Jet',
  water_jet: 'Water Jet',
  shuttle: 'Shuttle (Con thoi)',
  accessories: 'Phụ trợ',
  other: 'Khác',
};

export const LOOM_STATUSES = [
  'running',
  'idle',
  'maintenance',
  'breakdown',
  'setup',
] as const;

export type LoomStatus = (typeof LOOM_STATUSES)[number];

export const LOOM_STATUS_LABELS: Record<LoomStatus, string> = {
  running: 'Đang chạy',
  idle: 'Chờ việc',
  maintenance: 'Bảo trì',
  breakdown: 'Hỏng hóc',
  setup: 'Chuyển đổi/Setup',
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
  daily_capacity_kg: z.number().min(0, 'Cong suat >= 0').optional().nullable(),
  year_manufactured: z
    .number()
    .int()
    .min(1950, 'Nam >= 1950')
    .max(2100, 'Nam <= 2100')
    .optional()
    .nullable(),
  // Thong so ky thuat
  diameter_inch: z.number().min(0).optional().nullable(),
  gauge: z.number().int().min(0).optional().nullable(),
  feeders: z.number().int().min(0).optional().nullable(),
  needles: z.number().int().min(0).optional().nullable(),
  gsm_range: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  yarn_support: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .or(z.literal('')),
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
  loom_type: 'single_jersey',
  supplier_id: '',
  max_width_cm: null,
  max_speed_rpm: null,
  daily_capacity_m: null,
  daily_capacity_kg: null,
  year_manufactured: null,
  diameter_inch: null,
  gauge: null,
  feeders: null,
  needles: null,
  gsm_range: '',
  yarn_support: '',
  motor_power_kw: null,
  voltage: '',
  weight_kg: null,
  status: 'idle',
  notes: '',
};
