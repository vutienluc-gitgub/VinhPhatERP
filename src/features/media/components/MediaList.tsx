/**
 * MediaList — List/table view for media assets
 *
 * Renders items as rows with thumbnail, name, size, date.
 */

import { EmptyState } from '@/shared/components/EmptyState';
import type { MediaAsset } from '@/features/media/media.types';
import { MEDIA_LABELS } from '@/features/media/media.constants';

import { MediaItem } from './MediaItem';

interface MediaListProps {
  assets: MediaAsset[];
  selectedId: string | null;
  onSelect: (asset: MediaAsset) => void;
  isLoading: boolean;
  onUploadClick: () => void;
}

function ListSkeleton() {
  return (
    <div style={{ padding: '0.75rem 1.25rem' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`skel-list-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.6rem 0',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            className="media-skeleton-card"
            style={{
              width: 40,
              height: 40,
              aspectRatio: 'auto',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="media-skeleton-card"
              style={{
                height: 14,
                width: '60%',
                aspectRatio: 'auto',
                marginBottom: 6,
              }}
            />
            <div
              className="media-skeleton-card"
              style={{ height: 10, width: '30%', aspectRatio: 'auto' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MediaList({
  assets,
  selectedId,
  onSelect,
  isLoading,
  onUploadClick,
}: MediaListProps) {
  if (isLoading) {
    return <ListSkeleton />;
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
    <div className="media-list" id="media-list">
      {assets.map((asset) => (
        <MediaItem
          key={asset.id}
          asset={asset}
          isSelected={selectedId === asset.id}
          onSelect={onSelect}
          mode="list"
        />
      ))}
    </div>
  );
}
