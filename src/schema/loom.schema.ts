import { z } from 'zod';

export const LOOM_TYPES = [
  'rapier',
  'air_jet',
  'water_jet',
  'shuttle',
  'other',
] as const;

export type LoomType = (typeof LOOM_TYPES)[number];

export const LOOM_TYPE_LABELS: Record<LoomType, string> = {
  rapier: 'Rapier (Kim kẹp)',
  air_jet: 'Air Jet (Phun khí)',
  water_jet: 'Water Jet (Phun nước)',
  shuttle: 'Shuttle (Con thoi)',
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
  max_width_cm: z.number().min(0, 'Khổ dệt >= 0').optional().nullable(),
  max_speed_rpm: z.number().min(0, 'Tốc độ >= 0').optional().nullable(),
  daily_capacity_m: z.number().min(0, 'Công suất >= 0').optional().nullable(),
  year_manufactured: z
    .number()
    .int()
    .min(1950, 'Năm >= 1950')
    .max(2100, 'Năm <= 2100')
    .optional()
    .nullable(),
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
  status: 'active',
  notes: '',
};
