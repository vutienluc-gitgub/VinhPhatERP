import { z } from 'zod';

export const fabricStructureSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export const MACHINE_TYPES = [
  { value: 'single_jersey', label: 'Single Jersey' },
  { value: 'rib', label: 'Rib' },
  { value: 'interlock', label: 'Interlock' },
  { value: 'fleece', label: 'Fleece' },
  { value: 'pique', label: 'Pique' },
] as const;

export const MACHINE_MANUFACTURERS = [
  'Terrot',
  'Mayer & Cie',
  'Pai Lung',
  'Fukuhara',
  'Jingwei',
  'Wellknit',
  'Other',
];

export const MACHINE_FAMILIES = [
  'Single Jersey',
  'Rib',
  'Interlock',
  'Fleece',
  'Jacquard',
];

export const COMPATIBILITY_LEVELS = [
  {
    value: 'preferred',
    label: 'Tốt nhất (Preferred)',
    color: 'bg-success-soft text-success',
  },
  {
    value: 'recommended',
    label: 'Khuyên dùng (Recommended)',
    color: 'bg-info-soft text-info',
  },
  {
    value: 'allowed',
    label: 'Có thể dùng (Allowed)',
    color: 'bg-warning-soft text-warning-strong',
  },
  {
    value: 'restricted',
    label: 'Hạn chế (Restricted)',
    color: 'bg-warning-soft text-warning-strong',
  },
  {
    value: 'forbidden',
    label: 'Cấm (Forbidden)',
    color: 'bg-danger-soft text-danger',
  },
] as const;

export const machineSpecificationSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().optional(),
  manufacturer: z.string().nullable().optional(),
  machine_family: z.string().nullable().optional(),
  machine_type: z
    .string({ required_error: 'Vui lòng chọn loại máy' })
    .min(1, 'Vui lòng chọn loại máy'),
  diameter: z
    .number({ required_error: 'Bắt buộc nhập Diameter' })
    .min(20, 'Diameter nhỏ nhất là 20')
    .max(60, 'Diameter lớn nhất là 60'),
  gauge: z
    .number()
    .nullable()
    .optional()
    .refine(
      (val) => val === null || val === undefined || (val >= 10 && val <= 60),
      {
        message: 'Gauge phải từ 10 đến 60',
      },
    ),
  feeder_count: z
    .number({ required_error: 'Bắt buộc nhập Feeder Count' })
    .min(1, 'Feeder Count phải > 0'),
  is_active: z.boolean().default(true).optional(),
  source_type: z
    .enum(['auto_generated', 'manual'])
    .default('manual')
    .optional(),
});

export const yarnKnittingEngineeringSchema = z.object({
  id: z.string().uuid().optional(),
  yarn_id: z.string().uuid(),
  fabric_structure_id: z.string().uuid({ message: 'Vui lòng chọn Kiểu dệt' }),
  machine_spec_id: z.string().uuid({ message: 'Vui lòng chọn Cấu hình máy' }),
  compatibility_level: z.enum([
    'preferred',
    'recommended',
    'allowed',
    'restricted',
    'forbidden',
  ]),
  recommended_rpm: z
    .number()
    .min(1, 'RPM phải lớn hơn 0')
    .nullable()
    .optional(),
  max_rpm: z.number().min(1, 'RPM phải lớn hơn 0').nullable().optional(),
  expected_efficiency: z.number().min(0).max(1).nullable().optional(),
  expected_waste_pct: z.number().min(0).max(1).nullable().optional(),
  quality_risk_level: z.enum(['low', 'medium', 'high']).nullable().optional(),
  need_special_feeder: z.boolean().default(false),
  need_lycra_attachment: z.boolean().default(false),
  recommended_tension: z.string().nullable().optional(),
  feeding_type: z.enum(['positive', 'negative', 'auto']).nullable().optional(),
  recommended_stitch_length: z.number().min(0).nullable().optional(),
  production_notes: z.string().nullable().optional(),
});

export type FabricStructure = z.infer<typeof fabricStructureSchema>;
export type MachineSpecification = z.infer<typeof machineSpecificationSchema>;
export type YarnKnittingEngineering = z.infer<
  typeof yarnKnittingEngineeringSchema
>;
