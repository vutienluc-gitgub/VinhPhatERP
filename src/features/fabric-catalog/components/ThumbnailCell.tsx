import { useState } from 'react';

import { Icon } from '@/shared/components';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';

/**
 * Safe Thumbnail Component
 * Thay thế cho anti-pattern sửa outerHTML
 */
export function ThumbnailCell({ catalog }: { catalog: FabricCatalog }) {
  const [error, setError] = useState(false);

  if (!catalog.image_url || error) {
    return (
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
        <Icon name="Image" size={16} className="text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <img
      src={catalog.image_url}
      alt={catalog.name}
      className="w-10 h-10 rounded object-cover shrink-0 bg-surface"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
