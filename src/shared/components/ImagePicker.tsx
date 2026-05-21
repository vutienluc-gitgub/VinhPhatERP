/**
 * ImagePicker — Shared component for image upload with preview.
 *
 * Features:
 * - Preview current image
 * - Camera capture (mobile) + file select
 * - Loading spinner during upload
 * - Remove button
 */

import { useRef } from 'react';

import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';

// ── Constants ────────────────────────────────────────────────────────────────

const LABELS = {
  CAPTURE: 'Chụp ảnh',
  SELECT: 'Chọn file',
  REMOVE: 'Xóa ảnh',
  UPLOADING: 'Đang tải...',
  PLACEHOLDER: 'Chưa có ảnh sản phẩm',
} as const;

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic';

// ── Types ────────────────────────────────────────────────────────────────────

type ImagePickerProps = {
  /** Current image URL (null = no image) */
  value: string | null | undefined;
  /** Called when user selects a file to upload */
  onUpload: (file: File) => void;
  /** Called when user removes the image */
  onRemove: () => void;
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Error message from upload failure */
  error?: string | null;
  /** Disable interactions */
  disabled?: boolean;
};

// ── Component ────────────────────────────────────────────────────────────────

export function ImagePicker({
  value,
  onUpload,
  onRemove,
  isUploading,
  error,
  disabled = false,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  const isDisabled = disabled || isUploading;

  return (
    <div className="image-picker">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      {/* Preview area */}
      <div className="image-picker-preview">
        {isUploading ? (
          <div className="image-picker-loading">
            <div className="image-picker-spinner" />
            <span className="text-xs text-muted">{LABELS.UPLOADING}</span>
          </div>
        ) : value ? (
          <img
            src={value}
            alt="Product"
            className="image-picker-img"
            loading="lazy"
          />
        ) : (
          <div className="image-picker-placeholder">
            <Icon name="Image" size={32} className="text-muted" />
            <span className="text-xs text-muted">{LABELS.PLACEHOLDER}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="image-picker-actions">
        <Button
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isDisabled}
          title={LABELS.CAPTURE}
          leftIcon="Camera"
        >
          {LABELS.CAPTURE}
        </Button>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          title={LABELS.SELECT}
          leftIcon="Upload"
        >
          {LABELS.SELECT}
        </Button>
        {value && (
          <Button
            variant="danger"
            size="icon"
            onClick={onRemove}
            disabled={isDisabled}
            title={LABELS.REMOVE}
            leftIcon="Trash2"
          />
        )}
      </div>

      {/* Error */}
      {error && <p className="field-error mt-1">{error}</p>}
    </div>
  );
}
