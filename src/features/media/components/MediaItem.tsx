/**
 * MediaItem — Single file card (Grid mode) or row (List mode)
 *
 * Renders preview thumbnail for images, icon placeholders for
 * documents/videos, and file metadata (name, size, date).
 */

import { memo, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import dayjs from 'dayjs';

import { Icon } from '@/shared/components/Icon';
import type { IconName } from '@/shared/components/Icon';
import type { MediaAsset } from '@/features/media/media.types';
import {
  resolveFileType,
  formatFileSize,
} from '@/features/media/media.service';

interface MediaItemProps {
  asset: MediaAsset;
  isSelected: boolean;
  onSelect: (asset: MediaAsset) => void;
  mode: 'grid' | 'list';
}

function getFileIcon(mimeType: string): IconName {
  const type = resolveFileType(mimeType);
  switch (type) {
    case 'image':
      return 'Image';
    case 'video':
      return 'Video';
    case 'document':
      if (mimeType.includes('pdf')) return 'FileText';
      if (
        mimeType.includes('sheet') ||
        mimeType.includes('excel') ||
        mimeType.includes('csv')
      )
        return 'Sheet';
      return 'FileText';
    default:
      return 'File';
  }
}

export const MediaItem = memo(function MediaItem({
  asset,
  isSelected,
  onSelect,
  mode,
}: MediaItemProps) {
  const isImage = useMemo(
    () => asset.mime_type.startsWith('image/'),
    [asset.mime_type],
  );
  const icon = useMemo(() => getFileIcon(asset.mime_type), [asset.mime_type]);
  const sizeLabel = useMemo(
    () => formatFileSize(asset.size_bytes),
    [asset.size_bytes],
  );
  const dateLabel = useMemo(
    () => dayjs(asset.created_at).format('DD/MM/YYYY'),
    [asset.created_at],
  );
  const previewUrl = asset.public_url ?? undefined;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: asset.id,
    data: { type: 'Asset', asset },
  });

  if (mode === 'list') {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`media-list-item${isSelected ? ' is-selected' : ''}${isDragging ? ' opacity-50' : ''}`}
        onClick={() => onSelect(asset)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(asset);
          }
        }}
      >
        <div className="media-list-thumb">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt={asset.original_name} loading="lazy" />
          ) : (
            <Icon name={icon} size={20} />
          )}
        </div>
        <div className="media-list-info">
          <div className="media-list-name" title={asset.original_name}>
            {asset.original_name}
          </div>
          <div className="media-list-details">
            <span>{sizeLabel}</span>
            <span>{dateLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  // Grid mode
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`media-item-card${isSelected ? ' is-selected' : ''}${isDragging ? ' opacity-50' : ''}`}
      onClick={() => onSelect(asset)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(asset);
        }
      }}
    >
      <div className="media-item-preview">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={asset.original_name} loading="lazy" />
        ) : (
          <div className="media-item-preview-icon">
            <Icon name={icon} size={40} />
          </div>
        )}
      </div>
      <div className="media-item-info">
        <div className="media-item-name" title={asset.original_name}>
          {asset.original_name}
        </div>
        <div className="media-item-meta">
          <span>{sizeLabel}</span>
          <span>{dateLabel}</span>
        </div>
      </div>
    </div>
  );
});
