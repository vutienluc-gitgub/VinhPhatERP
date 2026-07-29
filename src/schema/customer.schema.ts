import { z } from 'zod';

import { validatePhone } from '@/shared/utils/phone';

export const CUSTOMER_SOURCES = [
  'referral',
  'exhibition',
  'zalo',
  'facebook',
  'online',
  'direct',
  'cold_call',
  'other',
] as const;

export const CUSTOMER_SOURCE_LABELS: Record<
  (typeof CUSTOMER_SOURCES)[number],
  string
> = {
  referral: 'Giới thiệu',
  exhibition: 'Triển lãm/Hội chợ',
  zalo: 'Zalo',
  facebook: 'Facebook',
  online: 'Online/Website',
  direct: 'Trực tiếp',
  cold_call: 'Telesales',
  other: 'Khác',
};

export const CUSTOMER_SOURCE_ICONS: Record<
  (typeof CUSTOMER_SOURCES)[number],
  string
> = {
  referral: 'UserPlus',
  exhibition: 'Tent',
  zalo: 'MessageCircle',
  facebook: 'Facebook',
  online: 'Globe',
  direct: 'User',
  cold_call: 'Phone',
  other: 'MoreHorizontal',
};

export const customersSchema = z.object({
  code: z.string().trim().min(2, 'Mã tối thiểu 2 ký tự'),
  name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9\s\-().]{8,20})?$/, 'Số điện thoại không hợp lệ')
    .refine(validatePhone, { message: 'Số điện thoại không hợp lệ' })
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  tax_code: z
    .string()
    .trim()
    .regex(/^(\d{10}|\d{13})?$/, 'Mã số thuế phải có 10 hoặc 13 chữ số')
    .optional()
    .or(z.literal('')),
  contact_person: z.string().trim().optional().or(z.literal('')),
  source: z.enum(CUSTOMER_SOURCES).default('other'),
  notes: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
  salesperson_id: z.string().uuid().optional().nullable().or(z.literal('')),
  lead_status: z
    .enum(['lead', 'opportunity', 'customer', 'lost'])
    .default('lead'),
});

export type CustomersFormValues = z.infer<typeof customersSchema>;

export const customersDefaultValues: CustomersFormValues = {
  code: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  tax_code: '',
  contact_person: '',
  source: 'other',
  notes: '',
  status: 'active',
  salesperson_id: '',
  lead_status: 'lead',
};

export const CUSTOMER_STATUS_LABELS: Record<'active' | 'inactive', string> = {
  active: 'Hoạt động',
  inactive: 'Ngừng hoạt động',
};

export type LeadStatus = 'lead' | 'opportunity' | 'customer' | 'lost';

export const CRM_STATUS_LABELS: Record<LeadStatus, string> = {
  lead: 'Tiềm năng',
  opportunity: 'Cơ hội/Báo giá',
  customer: 'Khách hàng',
  lost: 'Thất bại',
};

export const CRM_STATUS_ICONS: Record<LeadStatus, string> = {
  lead: 'UserPlus',
  opportunity: 'FileText',
  customer: 'Briefcase',
  lost: 'XCircle',
};

export type CustomersFilters = {
  query: string;
  status: 'all' | 'active' | 'inactive';
  salesperson_id?: string;
};

export type Customer = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_code: string | null;
  contact_person: string | null;
  source:
    | 'referral'
    | 'exhibition'
    | 'zalo'
    | 'facebook'
    | 'online'
    | 'direct'
    | 'cold_call'
    | 'other'
    | null;
  notes: string | null;
  status: 'active' | 'inactive';
  lead_status: LeadStatus;
  created_at: string;
  updated_at: string;
  salesperson_id?: string | null;
  salesperson?: {
    id: string;
    code: string;
    name: string;
  } | null;
};

export type CustomersFilter = {
  query?: string;
  status?: 'active' | 'inactive';
  salesperson_id?: string;
};

// FORM FIELDS (Tĩnh)
export const customerFormFields = [
  {
    name: 'name',
    label: 'Tên khách hàng',
    type: 'text',
    required: true,
  },
  {
    name: 'phone',
    label: 'SĐT',
    type: 'text',
    required: true,
  },
  {
    name: 'address',
    label: 'Địa chỉ',
    type: 'text',
  },
];

// TABLE COLUMNS (Tĩnh)
export const customerTableColumns = [
  {
    key: 'name',
    label: 'Tên',
  },
  {
    key: 'phone',
    label: 'SĐT',
  },
  {
    key: 'address',
    label: 'Địa chỉ',
  },
];

export const customerResponseSchema = z
  .object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
  })
  .passthrough();
