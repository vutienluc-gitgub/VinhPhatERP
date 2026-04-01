import { FeatureScaffoldPage } from '@/shared/components/FeatureScaffoldPage'
import { hasSupabaseEnv } from '@/services/supabase/client'

import { settingsFeature } from '@/features/settings/settings.module'

export function SettingsPage() {
  return (
    <FeatureScaffoldPage
      feature={{
        ...settingsFeature,
        summary: [
          { label: 'Supabase', value: hasSupabaseEnv() ? 'Connected' : 'Pending' },
          { label: 'Roles', value: '4 roles' },
          { label: 'Offline', value: 'Foundation' },
        ],
      }}
    />
  )
}