import { z } from 'zod';

export const CUSTOMER_SOURCES = ['direct', 'referral', 'facebook', 'website', 'exhibition', 'other'] as const;

export const CUSTOMER_SOURCE_LABELS: Record<string, string> = {
  direct: 'Trực tiếp / Tự tìm',
  referral: 'Giới thiệu',
  facebook: 'Facebook / Mạng XH',
  website: 'Website / Online',
  exhibition: 'Hội chợ triển lãm',
  other: 'Khác',
};

export const CUSTOMER_SOURCE_ICONS: Record<string, string> = {
  direct: 'Users',
  referral: 'UserCheck',
  facebook: 'Globe',
  website: 'Globe',
  exhibition: 'Award',
  other: 'HelpCircle',
};

export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  active: 'Đang giao dịch',
  potential: 'Tiềm năng',
  inactive: 'Ngưng giao dịch',
  dormant: 'Lâu chưa phát sinh',
};

export const CRM_STATUS_LABELS = CUSTOMER_STATUS_LABELS;

export const CRM_STATUS_ICONS: Record<string, string> = {
  active: 'CheckCircle2',
  potential: 'Clock',
  inactive: 'AlertCircle',
  dormant: 'Archive',
};

export const customersSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Mã khách hàng là bắt buộc'),
  name: z.string().min(1, 'Tên khách hàng là bắt buộc'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  tax_code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  source: z.string().optional().default('direct'),
  status: z.string().optional().default('active'),
  assigned_to: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  debt_limit: z.number().optional().default(0),
  payment_term_days: z.number().optional().default(30),
  group_id: z.string().optional().nullable(),
});

export type CustomersFormValues = z.infer<typeof customersSchema>;

export const customersDefaultValues: Partial<CustomersFormValues> = {
  code: '',
  name: '',
  phone: '',
  email: '',
  tax_code: '',
  address: '',
  source: 'direct',
  status: 'active',
  assigned_to: null,
  notes: '',
  debt_limit: 0,
  payment_term_days: 30,
};

export const customer_schema = customersSchema;
export const customerResponseSchema = customersSchema;
export default customersSchema;

