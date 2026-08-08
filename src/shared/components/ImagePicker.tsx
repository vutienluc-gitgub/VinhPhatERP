import { useRef, useState, DragEvent } from 'react';

import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { UploadState } from '@/shared/lib/image/types';

const LABELS = {
  CAPTURE: 'Chụp ảnh',
  SELECT: 'Chọn file',
  REMOVE: 'Xóa ảnh',
  PLACEHOLDER: 'Chưa có ảnh sản phẩm',
  DROP_HERE: 'Thả ảnh vào đây',
} as const;

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic';

type ImagePickerProps = {
  value: string | null | undefined;
  onSelect: (file: File) => void;
  onRemove: () => void;
  state?: UploadState;
  disabled?: boolean;
};

export function ImagePicker({
  value,
  onSelect,
  onRemove,
  state = { status: 'idle' },
  disabled = false,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
    }
    e.target.value = '';
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled && state.status === 'idle') {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || state.status !== 'idle') return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onSelect(file);
    }
  }

  const isProcessing =
    state.status !== 'idle' &&
    state.status !== 'error' &&
    state.status !== 'success';
  const isDisabled = disabled || isProcessing;

  const renderOverlay = () => {
    if (isDragging) {
      return (
        <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed flex items-center justify-center rounded-lg z-10">
          <span className="text-foreground font-medium">
            {LABELS.DROP_HERE}
          </span>
        </div>
      );
    }

    if (state.status === 'validating') {
      return (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg z-10">
          <div className="image-picker-spinner mb-2" />
          <span className="text-xs text-muted-foreground">
            Đang kiểm tra...
          </span>
        </div>
      );
    }

    if (state.status === 'compressing') {
      return (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg z-10">
          <div className="image-picker-spinner mb-2" />
          <span className="text-xs text-muted-foreground">
            Đang nén ảnh...{' '}
            {state.progress ? `${Math.round(state.progress)}%` : ''}
          </span>
        </div>
      );
    }

    if (state.status === 'uploading') {
      return (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg z-10">
          <div className="image-picker-spinner mb-2" />
          <span className="text-xs text-muted-foreground">
            Đang tải lên...{' '}
            {state.progress ? `${Math.round(state.progress)}%` : ''}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="image-picker flex flex-col gap-2">
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

      <div
        className="relative rounded-lg overflow-hidden border border-border bg-surface-secondary aspect-square flex items-center justify-center transition-colors hover:bg-background cursor-pointer"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!value && !isDisabled) {
            fileInputRef.current?.click();
          }
        }}
      >
        {renderOverlay()}

        {value ? (
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center pointer-events-none">
            <Icon name="ImagePlus" size={32} className="mb-2 opacity-50" />
            <span className="text-sm font-medium text-foreground">
              {LABELS.SELECT}
            </span>
            <span className="text-xs mt-1">hoặc kéo thả ảnh</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isDisabled}
          title={LABELS.CAPTURE}
          leftIcon="Camera"
          className="flex-1"
        >
          {LABELS.CAPTURE}
        </Button>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          title={LABELS.SELECT}
          leftIcon="Upload"
          className="flex-1"
        >
          {LABELS.SELECT}
        </Button>
      </div>

      {value && (
        <Button
          variant="danger"
          onClick={onRemove}
          disabled={isDisabled}
          title={LABELS.REMOVE}
          leftIcon="Trash2"
          className="w-full"
        >
          {LABELS.REMOVE}
        </Button>
      )}

      {state.status === 'error' && (
        <p className="field-error mt-1 text-sm">{state.message}</p>
      )}
    </div>
  );
}
