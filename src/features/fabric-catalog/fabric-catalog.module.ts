import { z } from 'zod'
import type { FeatureDefinition } from '@/shared/types/feature'

export const FABRIC_CATALOG_STATUSES = ['active', 'inactive'] as const

export const FABRIC_CATALOG_STATUS_LABELS: Record<'active' | 'inactive', string> = {
  active: 'Đang dùng',
  inactive: 'Ngưng dùng',
}

export const fabricCatalogSchema = z.object({
  code: z.string().trim().min(2, 'Mã tối thiểu 2 ký tự').max(50, 'Mã tối đa 50 ký tự'),
  name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự').max(200, 'Tên tối đa 200 ký tự'),
  composition: z.string().trim().max(200).optional().or(z.literal('')),
  unit: z.string().trim().min(1, 'Chọn đơn vị').max(20).default('kg'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  status: z.enum(FABRIC_CATALOG_STATUSES),
})

export type FabricCatalogFormValues = z.infer<typeof fabricCatalogSchema>

export const fabricCatalogDefaultValues: FabricCatalogFormValues = {
  code: '',
  name: '',
  composition: '',
  unit: 'kg',
  notes: '',
  status: 'active',
}

export const fabricCatalogFeature: FeatureDefinition = {
  key: 'fabric-catalog',
  route: '/fabric-catalog',
  title: 'Danh mục vải',
  badge: 'Master Data',
  description: 'Quản lý danh mục loại vải — dùng chung cho vải mộc và vải thành phẩm.',
  summary: [
    { label: 'Loại dữ liệu', value: 'Master Data' },
    { label: 'Tích hợp', value: 'BOM, Vải mộc, Thành phẩm' },
  ],
  highlights: [
    'Chuẩn hoá tên và thành phần vải, giảm lỗi nhập liệu.',
    'Dùng chung cho BOM, nhập vải mộc và vải thành phẩm.',
  ],
  resources: [
    'Bảng fabric_catalogs với mã, tên, thành phần.',
    'FK target_fabric_id trong bom_templates.',
  ],
  entities: ['FabricCatalog'],
  nextMilestones: [
    'Liên kết với raw_fabric_rolls và finished_fabric_rolls.',
  ],
}
