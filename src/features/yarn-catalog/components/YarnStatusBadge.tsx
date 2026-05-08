import { Badge, type BadgeVariant } from '@/shared/components';
import { YARN_CATALOG_STATUS_LABELS } from '@/schema/yarn-catalog.schema';
import type { YarnCatalogStatus } from '@/features/yarn-catalog/types';

export function YarnStatusBadge({ status }: { status: YarnCatalogStatus }) {
  const variant: BadgeVariant = status === 'active' ? 'success' : 'gray';
  return <Badge variant={variant}>{YARN_CATALOG_STATUS_LABELS[status]}</Badge>;
}
