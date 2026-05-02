/**
 * MediaDetailPanel — Right panel showing selected file details
 *
 * Displays file preview, metadata, and action buttons
 * (download, copy URL, rename, delete).
 */

import { useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import { Icon } from '@/shared/components/Icon';
import type { MediaAsset } from '@/features/media/media.types';
import { MEDIA_LABELS } from '@/features/media/media.constants';
import {
  formatFileSize,
  getDownloadUrl,
  resolveFileType,
} from '@/features/media/media.service';
import { useSoftDeleteAsset } from '@/features/media/useMedia';

interface MediaDetailPanelProps {
  asset: MediaAsset | null;
  onClose: () => void;
}

export function MediaDetailPanel({ asset, onClose }: MediaDetailPanelProps) {
  const deleteAsset = useSoftDeleteAsset();

  const isImage = useMemo(
    () => asset?.mime_type.startsWith('image/') ?? false,
    [asset],
  );

  const fileType = useMemo(
    () => (asset ? resolveFileType(asset.mime_type) : 'other'),
    [asset],
  );

  const handleCopyUrl = useCallback(async () => {
    if (!asset) return;
    try {
      const url = await getDownloadUrl(asset);
      await navigator.clipboard.writeText(typeof url === 'string' ? url : '');
      toast.success(MEDIA_LABELS.COPY_URL_SUCCESS);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  }, [asset]);

  const handleDownload = useCallback(async () => {
    if (!asset) return;
    try {
      const url = await getDownloadUrl(asset);
      const resolved = typeof url === 'string' ? url : '';
      window.open(resolved, '_blank', 'noopener');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  }, [asset]);

  const handleDelete = useCallback(async () => {
    if (!asset) return;
    if (!window.confirm(MEDIA_LABELS.DELETE_CONFIRM)) return;

    try {
      await deleteAsset.mutateAsync(asset.id);
      toast.success(MEDIA_LABELS.FILE_DELETED);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  }, [asset, deleteAsset, onClose]);

  if (!asset) return null;

  return (
    <div className="media-detail-panel" id="media-detail-panel">
      {/* Preview */}
      <div className="media-detail-preview">
        {isImage && asset.public_url ? (
          <img src={asset.public_url} alt={asset.original_name} />
        ) : (
          <Icon
            name={
              fileType === 'video'
                ? 'Video'
                : fileType === 'document'
                  ? 'FileText'
                  : 'File'
            }
            size={56}
            style={{ color: 'var(--muted)', opacity: 0.4 }}
          />
        )}
      </div>

      {/* Info */}
      <div className="media-detail-info">
        <div className="media-detail-name">{asset.original_name}</div>

        <div className="media-detail-row">
          <span className="media-detail-label">Loại</span>
          <span className="media-detail-value">{asset.mime_type}</span>
        </div>
        <div className="media-detail-row">
          <span className="media-detail-label">Kích thước</span>
          <span className="media-detail-value">
            {formatFileSize(asset.size_bytes)}
          </span>
        </div>
        <div className="media-detail-row">
          <span className="media-detail-label">Ngày tạo</span>
          <span className="media-detail-value">
            {dayjs(asset.created_at).format('DD/MM/YYYY HH:mm')}
          </span>
        </div>
        <div className="media-detail-row">
          <span className="media-detail-label">Bucket</span>
          <span className="media-detail-value">{asset.bucket}</span>
        </div>
        {asset.is_public && (
          <div className="media-detail-row">
            <span className="media-detail-label">Public</span>
            <span
              className="badge badge-success"
              style={{ fontSize: '0.7rem' }}
            >
              Public
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="media-detail-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={handleDownload}
          style={{ justifyContent: 'center' }}
        >
          <Icon name="Download" size={16} />
          Tải xuống
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleCopyUrl}
          style={{ justifyContent: 'center' }}
        >
          <Icon name="Link" size={16} />
          Sao chép URL
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={handleDelete}
          disabled={deleteAsset.isPending}
          style={{
            justifyContent: 'center',
            padding: '0.55rem 1rem',
            borderRadius: '999px',
            fontSize: '0.88rem',
          }}
        >
          <Icon name="Trash2" size={16} />
          {deleteAsset.isPending ? 'Đang xoá...' : 'Xoá file'}
        </button>
      </div>
    </div>
  );
}
