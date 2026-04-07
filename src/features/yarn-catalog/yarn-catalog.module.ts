import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

export const YARN_CATALOG_STATUSES = ['active', 'inactive'] as const

export const YARN_CATALOG_STATUS_LABELS: Record<'active' | 'inactive', string> = {
  active: 'Đang dùng',
  inactive: 'Ngưng dùng',
}

export const yarnCatalogSchema = z.object({
  code: z.string().trim().min(2, 'Mã tối thiểu 2 ký tự').max(50, 'Mã tối đa 50 ký tự'),
  name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự').max(200, 'Tên tối đa 200 ký tự'),
  composition: z.string().trim().max(200).optional().or(z.literal('')),
  color_name: z.string().trim().max(120).optional().or(z.literal('')),
  tensile_strength: z.string().trim().max(50).optional().or(z.literal('')),
  origin: z.string().trim().max(100).optional().or(z.literal('')),
  unit: z.string().trim().min(1, 'Chọn đơn vị').max(20),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  status: z.enum(YARN_CATALOG_STATUSES),
})

export type YarnCatalogFormValues = z.infer<typeof yarnCatalogSchema>

export const yarnCatalogDefaultValues: YarnCatalogFormValues = {
  code: '',
  name: '',
  composition: '',
  color_name: '',
  tensile_strength: '',
  origin: '',
  unit: 'kg',
  notes: '',
  status: 'active',
}

export const yarnCatalogFeature: FeatureDefinition = {
  key: 'yarn-catalog',
  route: '/yarn-catalog',
  title: 'Danh mục sợi',
  badge: 'Master Data',
  description: 'Quản lý danh mục loại sợi chuẩn — dùng lại khi tạo phiếu nhập sợi.',
  summary: [
    { label: 'Loại dữ liệu', value: 'Master Data' },
    { label: 'Tích hợp', value: 'Nhập sợi' },
  ],
  highlights: [
    'Chuẩn hoá tên và thành phần sợi, giảm lỗi nhập liệu.',
    'Auto-fill thông tin kỹ thuật khi chọn loại sợi trong phiếu nhập.',
    'Tra cứu lịch sử nhập theo từng loại sợi.',
  ],
  resources: [
    'Bảng yarn_catalogs với mã, tên, thành phần, xuất xứ.',
    'FK yarn_catalog_id trong yarn_receipt_items.',
  ],
  entities: ['YarnCatalog'],
  nextMilestones: [
    'Thêm giá đơn vị tham khảo theo từng NCC.',
    'Lịch sử nhập theo loại sợi.',
  ],
}
