import { FeatureScaffoldPage } from '@/shared/components/FeatureScaffoldPage'

import { reportsFeature } from '@/features/reports/reports.module'

export function ReportsPage() {
  return <FeatureScaffoldPage feature={reportsFeature} />
}