import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { EntityType } from '@/shared/constants/entity.constants';
import { useGlobalEntity } from '@/shared/contexts/GlobalEntityContext';

/**
 * Reads `?previewId=<id>` from URL search params,
 * opens the entity drawer, and removes the param.
 *
 * Usage: call once per page component that supports deep-link preview.
 *
 * @example
 * ```tsx
 * // In CustomersPage.tsx
 * usePreviewIdFromUrl('customer');
 * ```
 */
export function usePreviewIdFromUrl(entityType: EntityType): void {
  const { openEntity } = useGlobalEntity();
  const [searchParams, setSearchParams] = useSearchParams();
  const previewId = searchParams.get('previewId');

  useEffect(() => {
    if (!previewId) return;

    openEntity(entityType, previewId);

    const next = new URLSearchParams(searchParams);
    next.delete('previewId');
    setSearchParams(next, { replace: true });
  }, [previewId, entityType, openEntity, searchParams, setSearchParams]);
}
