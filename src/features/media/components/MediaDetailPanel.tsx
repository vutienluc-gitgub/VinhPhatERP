/**
 * MediaDetailPanel — Right panel showing selected file details
 *
 * Displays file preview, metadata, and action buttons
 * (download, copy URL, rename, delete).
 */

import { useCallback, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components';
import type { MediaAsset } from '@/features/media/media.types';
import { MEDIA_LABELS } from '@/features/media/media.constants';
import {
  formatFileSize,
  getDownloadUrl,
  resolveFileType,
} from '@/features/media/media.service';
import {
  useSoftDeleteAsset,
  useRenameAsset,
  useMoveAsset,
  useMediaFolders,
} from '@/features/media/useMedia';
import {
  extractReceiptInfo,
  type ExtractedReceipt,
} from '@/features/media/media.ai.service';
import { formatCurrency } from '@/shared/utils/format';

interface MediaDetailPanelProps {
  asset: MediaAsset | null;
  onClose: () => void;
}

export function MediaDetailPanel({ asset, onClose }: MediaDetailPanelProps) {
  const deleteAsset = useSoftDeleteAsset();
  const renameAsset = useRenameAsset();
  const moveAsset = useMoveAsset();
  const { data: folders = [] } = useMediaFolders();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedReceipt | null>(
    null,
  );

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

  const handleRename = useCallback(async () => {
    if (!asset) return;
    const newName = window.prompt(MEDIA_LABELS.RENAME, asset.original_name);
    if (!newName || newName === asset.original_name) return;

    try {
      await renameAsset.mutateAsync({ assetId: asset.id, name: newName });
      toast.success(MEDIA_LABELS.RENAME_SUCCESS);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  }, [asset, renameAsset]);

  const handleMove = useCallback(
    async (folderId: string | null) => {
      if (!asset) return;
      try {
        await moveAsset.mutateAsync({ assetId: asset.id, folderId });
        toast.success(MEDIA_LABELS.MOVE_SUCCESS);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message);
      }
    },
    [asset, moveAsset],
  );

  const handleAnalyze = useCallback(async () => {
    if (!asset) return;
    setIsAnalyzing(true);
    setExtractedData(null);
    try {
      const data = await extractReceiptInfo(asset);
      setExtractedData(data);
      if (data.is_likely_receipt) {
        toast.success(MEDIA_LABELS.EXTRACTION_SUCCESS);
      } else {
        toast.error(MEDIA_LABELS.EXTRACTION_ERROR);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [asset]);

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
        <div className="media-detail-name-row">
          <div className="media-detail-name">{asset.original_name}</div>
          <button
            type="button"
            className="btn-icon-sm"
            onClick={handleRename}
            title={MEDIA_LABELS.RENAME}
          >
            <Icon name="Pencil" size={14} />
          </button>
        </div>

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
          <span className="media-detail-label">Thư mục</span>
          <select
            className="media-detail-select"
            value={asset.folder_id ?? ''}
            onChange={(e) => handleMove(e.target.value || null)}
          >
            <option value="">{MEDIA_LABELS.ROOT_FOLDER}</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        {asset.is_public && (
          <div className="media-detail-row">
            <span className="media-detail-label">Public</span>
            <Badge variant="success" className="text-[0.7rem]">
              Public
            </Badge>
          </div>
        )}
      </div>

      {/* AI Extraction Results */}
      {extractedData?.is_likely_receipt && (
        <div className="media-detail-ai-results">
          <div className="media-detail-ai-header">
            <Icon name="Sparkles" size={16} />
            <span>Thông tin giao dịch trích xuất</span>
          </div>
          <div className="media-detail-ai-body">
            <div className="ai-row">
              <span className="ai-label">Ngân hàng:</span>
              <span className="ai-value">{extractedData.bank_name}</span>
            </div>
            <div className="ai-row">
              <span className="ai-label">Số tiền:</span>
              <span className="ai-value font-bold text-[var(--primary-strong)]">
                {formatCurrency(extractedData.amount ?? 0)}{' '}
                {extractedData.currency}
              </span>
            </div>
            <div className="ai-row">
              <span className="ai-label">Ngày:</span>
              <span className="ai-value">
                {extractedData.transaction_date
                  ? dayjs(extractedData.transaction_date).format(
                      'DD/MM/YYYY HH:mm',
                    )
                  : 'N/A'}
              </span>
            </div>
            <div className="ai-row">
              <span className="ai-label">Mã GD:</span>
              <span className="ai-value text-[0.75rem] font-mono">
                {extractedData.reference_number}
              </span>
            </div>
            <div className="ai-row">
              <span className="ai-label">Nội dung:</span>
              <span className="ai-value italic">"{extractedData.content}"</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary w-full mt-2 py-1.5 text-xs"
            onClick={() =>
              toast.success('Chức năng Tạo phiếu chi đang phát triển')
            }
            style={{
              justifyContent: 'center',
              borderRadius: '6px',
              fontSize: '0.7rem',
              padding: '0.4rem',
            }}
          >
            Tạo phiếu chi từ thông tin này
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="media-detail-actions">
        {isImage && (
          <button
            type="button"
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            style={{
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              border: 'none',
              color: 'white',
            }}
          >
            <Icon
              name={isAnalyzing ? 'Loader2' : 'Sparkles'}
              size={16}
              className={isAnalyzing ? 'animate-spin' : ''}
            />
            {isAnalyzing
              ? MEDIA_LABELS.ANALYZING
              : MEDIA_LABELS.ANALYZE_RECEIPT}
          </button>
        )}
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
