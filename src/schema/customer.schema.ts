import { z } from "zod"

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

export type Customer = {
  id: string
  code: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  tax_code: string | null
  contact_person: string | null
  source: 'referral' | 'exhibition' | 'zalo' | 'facebook' | 'online' | 'direct' | 'cold_call' | 'other' | null
  notes: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type CustomersFilter = {
  query?: string
  status?: 'active' | 'inactive'
}

// FORM FIELDS (Tĩnh)
export const customerFormFields = [
  { name: "name", label: "Tên khách hàng", type: "text", required: true },
  { name: "phone", label: "SĐT", type: "text", required: true },
  { name: "address", label: "Địa chỉ", type: "text" },
]

// TABLE COLUMNS (Tĩnh)
export const customerTableColumns = [
  { key: "name", label: "Tên" },
  { key: "phone", label: "SĐT" },
  { key: "address", label: "Địa chỉ" },
]