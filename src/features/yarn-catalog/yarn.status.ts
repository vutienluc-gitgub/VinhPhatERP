import type { StatusConfig } from '@/shared/components/status/status.tokens';
import { YARN_CATALOG_STATUS_LABELS } from '@/schema/yarn-catalog.schema';
import type { YarnCatalogStatus } from '@/features/yarn-catalog/types';

export const yarnCatalogStatus = {
  active: {
    label: YARN_CATALOG_STATUS_LABELS['active'],
    variant: 'success',
  },
  inactive: {
    label: YARN_CATALOG_STATUS_LABELS['inactive'],
    variant: 'gray',
  },
} satisfies Record<YarnCatalogStatus, StatusConfig>;

export function parseYarnCatalogStatus(
  status: unknown,
): YarnCatalogStatus | 'unknown' {
  if (typeof status === 'string' && status in yarnCatalogStatus) {
    return status as YarnCatalogStatus;
  }
  return 'unknown';
}
