import type { FeatureDefinition } from '@/shared/types/feature'

export {
  YARN_CATALOG_STATUSES,
  YARN_CATALOG_STATUS_LABELS,
  yarnCatalogSchema,
  yarnCatalogDefaultValues,
} from '@/schema/yarn-catalog.schema'
export type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema'

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
