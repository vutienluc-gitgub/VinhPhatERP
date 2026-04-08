import type { FeatureDefinition } from '@/shared/types/feature';

// Schemas & types re-exported from centralized schema registry
export {
  authSchema,
  authDefaultValues,
  registerSchema,
  registerDefaultValues,
} from '@/schema/auth.schema';
export type { AuthFormValues, RegisterFormValues } from '@/schema/auth.schema';

export const authFeature: FeatureDefinition = {
  key: 'auth',
  route: '/auth',
  title: 'Đăng nhập và phân quyền',
  badge: 'Foundation',
  description:
    'Auth là điểm vào của V2, quản lý sign in, session state, role-based access và route guard theo từng vai trò.',
  summary: [
    {
      label: 'Roles',
      value: '4',
    },
    {
      label: 'Session mode',
      value: 'Supabase',
    },
    {
      label: 'Guards',
      value: 'Planned',
    },
  ],
  highlights: [
    'Login & Sign Up mobile-first với email, password.',
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
};
