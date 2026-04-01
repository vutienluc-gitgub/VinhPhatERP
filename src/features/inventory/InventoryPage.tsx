import { FeatureScaffoldPage } from '@/shared/components/FeatureScaffoldPage'

import { inventoryFeature } from '@/features/inventory/inventory.module'

export function InventoryPage() {
  return <FeatureScaffoldPage feature={inventoryFeature} />
}