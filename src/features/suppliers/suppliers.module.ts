import type { FeatureDefinition } from '@/shared/types/feature'

export {
  SUPPLIER_CATEGORIES,
  SUPPLIER_STATUSES,
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_STATUS_LABELS,
  supplierSchema,
  supplierDefaults,
} from '@/schema/supplier.schema'
export type { SupplierFormValues } from '@/schema/supplier.schema'

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