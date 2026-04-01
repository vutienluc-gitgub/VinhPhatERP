import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

export const settingsSchema = z.object({
  companyName: z.string().trim().min(2),
  companyPhone: z.string().trim().max(20).optional().or(z.literal('')),
  currency: z.string().trim().min(3),
  orderPrefix: z.string().trim().min(1),
  shipmentPrefix: z.string().trim().min(1),
  paymentPrefix: z.string().trim().min(1),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>

export const settingsFeature: FeatureDefinition = {
  key: 'settings',
  route: '/settings',
  title: 'Cài đặt',
  badge: 'Scaffolded',
  description:
    'Trang config cho env, auth settings và rollout theo từng phase của V2.',
  summary: [
    { label: 'Supabase', value: 'Env check' },
    { label: 'Roles', value: '4 roles' },
    { label: 'Offline', value: 'Foundation' },
  ],
  highlights: [
    'Chỉ admin mới được xem và sửa.',
    'Đánh dấu rõ các config bắt buộc trước khi deploy.',
    'Dùng để kiểm tra env và rollout guardrails.',
  ],
  resources: [
    'Ho tro env validation va health checks.',
    'Bao gom auth config va feature flags sau nay.',
    'Them diagnostics cho queue va sync.',
  ],
  entities: ['Company profile', 'Document prefix', 'Feature flag', 'Diagnostics'],
  nextMilestones: [
    'Load settings tu bang settings cua Supabase.',
    'Tach diagnostics cho env, queue va auth.',
    'Them guard chi admin cho route nay.',
  ],
}