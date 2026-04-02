import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

export const CUSTOMER_SOURCES = ['referral', 'exhibition', 'zalo', 'facebook', 'online', 'direct', 'cold_call', 'other'] as const

export const CUSTOMER_SOURCE_LABELS: Record<typeof CUSTOMER_SOURCES[number], string> = {
  referral: 'Giới thiệu',
  exhibition: 'Triển lãm/Hội chợ',
  zalo: 'Zalo',
  facebook: 'Facebook',
  online: 'Online/Website',
  direct: 'Trực tiếp',
  cold_call: 'Telesales',
  other: 'Khác',
}

export const customersSchema = z.object({
  code: z.string().trim().min(2, 'Mã tối thiểu 2 ký tự'),
  name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự'),
  phone: z.string().trim().regex(/^(\+?[0-9\s\-().]{8,20})?$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  tax_code: z.string().trim().regex(/^(\d{10}|\d{13})?$/, 'Mã số thuế phải có 10 hoặc 13 chữ số').optional().or(z.literal('')),
  contact_person: z.string().trim().optional().or(z.literal('')),
  source: z.enum(CUSTOMER_SOURCES).default('other'),
  notes: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
})

export type CustomersFormValues = z.infer<typeof customersSchema>

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
}

export const CUSTOMER_STATUS_LABELS: Record<'active' | 'inactive', string> = {
  active: 'Hoạt động',
  inactive: 'Ngừng hoạt động',
}

export type CustomersFilters = {
  query: string
  status: 'all' | 'active' | 'inactive'
}

export const customersFeature: FeatureDefinition = {
  key: 'customers',
  route: '/customers',
  title: 'Khách hàng',
  badge: 'Scaffolded',
  description:
    'Master data khách hàng sẽ là nền cho order, shipments, payments và report công nợ.',
  highlights: [
    'Search và quick select trên mobile.',
    'Hỗ trợ contact, phone, address và customer code.',
    'Sẵn sàng kết nối với order và payment records.',
  ],
  resources: [
    'Bang customers trong migration dau tien.',
    'Form tao va chinh sua khach hang bang React Hook Form + Zod.',
    'Autocomplete de dung lai trong orders va payments.',
  ],
  entities: ['Customer', 'Contact', 'Address', 'Debt summary'],
  nextMilestones: [
    'Tao list page voi search, filter va empty state.',
    'Them form CRUD toi uu cho mobile keyboard.',
    'Noi vao orders, shipments va payments lookup.',
  ],
}