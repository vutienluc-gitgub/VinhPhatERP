import type { BadgeVariant } from '@/shared/components';
import type { FabricCatalogStatus } from '@/domain/settings/fabric-catalog.types';

export function getStatusVariant(status: FabricCatalogStatus): BadgeVariant {
  return status === 'active' ? 'success' : 'gray';
}
