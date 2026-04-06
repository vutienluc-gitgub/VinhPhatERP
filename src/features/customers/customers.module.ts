import type { FeatureDefinition } from '@/shared/types/feature'

export * from '@/schema/customer.schema'

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