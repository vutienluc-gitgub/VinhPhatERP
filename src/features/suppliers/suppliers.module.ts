import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

export const SUPPLIER_CATEGORIES = ['yarn', 'dye', 'weaving', 'accessories', 'other'] as const
export const SUPPLIER_STATUSES = ['active', 'inactive'] as const

export const SUPPLIER_CATEGORY_LABELS: Record<typeof SUPPLIER_CATEGORIES[number], string> = {
  yarn: 'Sợi',
  dye: 'Thuốc nhuộm',
  weaving: 'Nhà dệt',
  accessories: 'Phụ liệu',
  other: 'Khác',
}

export const SUPPLIER_STATUS_LABELS: Record<typeof SUPPLIER_STATUSES[number], string> = {
  active: 'Hoạt động',
  inactive: 'Ngưng hợp tác',
}

export const supplierSchema = z.object({
  code: z.string().min(1, 'Mã NCC là bắt buộc').max(50, 'Mã NCC tối đa 50 ký tự'),
  name: z.string().min(1, 'Tên NCC là bắt buộc').max(200, 'Tên NCC tối đa 200 ký tự'),
  category: z.enum(SUPPLIER_CATEGORIES, { required_error: 'Chọn danh mục NCC' }),
  phone: z.string().regex(/^(\+?[0-9\s\-().]{8,20})?$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  email: z.string().email('Email không hợp lệ').or(z.literal('')).optional(),
  address: z.string().max(500).optional(),
  tax_code: z.string().regex(/^(\d{10}|\d{13})?$/, 'Mã số thuế phải có 10 hoặc 13 chữ số').max(20).optional().or(z.literal('')),
  contact_person: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(SUPPLIER_STATUSES),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

export const supplierDefaults: SupplierFormValues = {
  code: '',
  name: '',
  category: 'other',
  phone: '',
  email: '',
  address: '',
  tax_code: '',
  contact_person: '',
  notes: '',
  status: 'active',
}

export const suppliersFeature: FeatureDefinition = {
  key: 'suppliers',
  route: '/suppliers',
  title: 'Nhà cung cấp',
  badge: 'Scaffolded',
  description:
    'Nhà cung cấp được tách rõ theo nghiệp vụ sợi, dệt, nhuộm và dịch vụ để liên kết dữ liệu nguồn cung.',
  highlights: [
    'Loại nhà cung cấp và contact management.',
    'Dùng lại trong nhập sợi, vải mộc và vải thành phẩm.',
    'Trạng thái active để gom dữ liệu master data gọn hơn.',
  ],
  resources: [
    'Schema suppliers va supplier_category.',
    'List view mobile-card va desktop-table.',
    'Quick actions cho chinh sua va khoa du lieu.',
  ],
  entities: ['Supplier', 'Category', 'Contact', 'Tax profile'],
  nextMilestones: [
    'Bo sung filter theo category va status.',
    'Tao quick picker de dung lai o receipts.',
    'Theo doi lead time va do tin cay nha cung cap.',
  ],
}