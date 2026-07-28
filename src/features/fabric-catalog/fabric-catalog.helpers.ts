import type { BadgeVariant } from '@/shared/components';
import type { FabricCatalogStatus } from '@/domain/settings/fabric-catalog.types';

export function getStatusVariant(status: FabricCatalogStatus): BadgeVariant {
  return status === 'active' ? 'success' : 'danger';
}

export function formatCompositionParts(
  parts: unknown[] | null | undefined,
  fallback: string | null = null,
): string | null {
  if (!parts || parts.length === 0) return fallback;

  const tags = parts
    .map((p: unknown) => {
      if (typeof p === 'string') return p.trim();
      if (p && typeof p === 'object') {
        const obj = p as Record<string, unknown>;
        const perc = String(obj.percentage || '').trim();
        const fib = String(obj.fiber || '').trim();
        if (perc && fib) return `${perc}% ${fib}`;
        if (fib) return fib;
      }
      return '';
    })
    .filter(Boolean);

  return tags.length > 0 ? tags.join(', ') : fallback;
}
