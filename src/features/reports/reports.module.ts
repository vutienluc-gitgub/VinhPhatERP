import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

export const reportsFilterSchema = z.object({
  dateFrom: z.string().trim().optional().or(z.literal('')),
  dateTo: z.string().trim().optional().or(z.literal('')),
  customerId: z.string().uuid().optional().or(z.literal('')),
  groupBy: z.enum(['day', 'week', 'month']),
}).refine(
  (data) => {
    if (!data.dateFrom || !data.dateTo) return true
    return data.dateTo >= data.dateFrom
  },
  { message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['dateTo'] },
)

export type ReportsFilterValues = z.infer<typeof reportsFilterSchema>

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