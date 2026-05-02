/**
 * MediaGrid — Grid view for media assets
 *
 * Renders items in a responsive CSS grid layout.
 */

import { EmptyState } from '@/shared/components/EmptyState';
import type { MediaAsset } from '@/features/media/media.types';
import { MEDIA_LABELS } from '@/features/media/media.constants';

import { MediaItem } from './MediaItem';

interface MediaGridProps {
  assets: MediaAsset[];
  selectedId: string | null;
  onSelect: (asset: MediaAsset) => void;
  isLoading: boolean;
  onUploadClick: () => void;
}

function GridSkeleton() {
  return (
    <div className="media-skeleton-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={`skel-${i}`} className="media-skeleton-card" />
      ))}
    </div>
  );
}

export function MediaGrid({
  assets,
  selectedId,
  onSelect,
  isLoading,
  onUploadClick,
}: MediaGridProps) {
  if (isLoading) {
    return <GridSkeleton />;
  }

  if (assets.length === 0) {
    return (
      <div className="media-empty">
        <EmptyState
          title={MEDIA_LABELS.NO_FILES}
          description={MEDIA_LABELS.NO_FILES_DESCRIPTION}
          icon="Image"
          actionLabel={MEDIA_LABELS.UPLOAD}
          actionClick={onUploadClick}
        />
      </div>
    );
  }

  return (
    <div className="media-grid" id="media-grid">
      {assets.map((asset) => (
        <MediaItem
          key={asset.id}
          asset={asset}
          isSelected={selectedId === asset.id}
          onSelect={onSelect}
          mode="grid"
        />
      ))}
    </div>
  );
}
