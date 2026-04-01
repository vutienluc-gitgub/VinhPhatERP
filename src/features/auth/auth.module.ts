import { z } from 'zod'

import type { FeatureDefinition } from '@/shared/types/feature'

export const authSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().default(true),
})

export type AuthFormValues = z.infer<typeof authSchema>

export const authDefaultValues: AuthFormValues = {
  email: '',
  password: '',
  rememberMe: true,
}

export const authFeature: FeatureDefinition = {
  key: 'auth',
  route: '/auth',
  title: 'Đăng nhập và phân quyền',
  badge: 'Foundation',
  description:
    'Auth là điểm vào của V2, quản lý sign in, session state, role-based access và route guard theo từng vai trò.',
  summary: [
    { label: 'Roles', value: '4' },
    { label: 'Session mode', value: 'Supabase' },
    { label: 'Guards', value: 'Planned' },
  ],
  highlights: [
    'Login mobile-first với email, password và remember me.',
    'Role map theo profiles: admin, manager, staff, viewer.',
    'Bảo vệ route và ẩn hiện navigation theo quyền.',
  ],
  resources: [
    'Tao supabase browser client va auth repository.',
    'Them session bootstrap trong AppProviders.',
    'Xay route guard va unauthorized states.',
  ],
  entities: ['Session', 'Profile', 'Role', 'Permission'],
  nextMilestones: [
    'Wire Supabase auth state listener.',
    'Them login form voi React Hook Form + Zod.',
    'Protect settings, inventory adjustments va reports.',
  ],
}