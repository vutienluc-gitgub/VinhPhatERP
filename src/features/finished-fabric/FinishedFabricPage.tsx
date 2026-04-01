import { FeatureScaffoldPage } from '@/shared/components/FeatureScaffoldPage'

import { finishedFabricFeature } from '@/features/finished-fabric/finished-fabric.module'

export function FinishedFabricPage() {
  return <FeatureScaffoldPage feature={finishedFabricFeature} />
}