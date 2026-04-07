import type { FeatureDefinition } from '@/shared/types/feature'

export {
  reportsFilterSchema,
} from '@/schema/report.schema'
export type { ReportsFilterValues } from '@/schema/report.schema'

export const reportsFeature: FeatureDefinition = {
  key: 'reports',
  route: '/reports',
  title: 'Báo cáo',
  description:
    'Tổng hợp doanh thu, công nợ, tồn kho và đơn trễ hạn trên một dashboard báo cáo chi tiết.',
  highlights: [
    'KPI cards phải đọc tốt trên mobile.',
    'Chart chỉ dùng cho insight, không thay thế số liệu cốt lõi.',
    'Filter theo time range và customer segments.',
  ],
  resources: [
    'React Query cho fetch report slices.',
    'Tan dung SQL views trong Supabase.',
    'Design desktop chart va mobile summary tach biet.',
  ],
  entities: ['Revenue KPI', 'Debt aging', 'Inventory health', 'Due orders'],
  nextMilestones: [
    'Them report slice theo dashboard widget.',
    'Tai su dung SQL views cho order va inventory summary.',
    'Bo sung xuat Excel/PDF sau MVP.',
  ],
}