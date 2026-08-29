import { useRef, useState } from 'react';

import { Icon } from '@/shared/components';

export interface EvidenceCameraProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  maxPhotos?: number;
}

export function EvidenceCamera({
  photos,
  onChange,
  maxPhotos = 4,
}: EvidenceCameraProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    const addedFiles = files.slice(0, remainingSlots);
    const updatedPhotos = [...photos, ...addedFiles];

    onChange(updatedPhotos);

    const newPreviewUrls = addedFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviewUrls]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleRemovePhoto(index: number) {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onChange(updatedPhotos);

    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--foreground)]">
          Ảnh bằng chứng hiện trường ({photos.length}/{maxPhotos})
        </label>
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-[var(--primary)] font-medium flex items-center gap-1 hover:underline"
          >
            <Icon name="Camera" size={14} />
            <span>Chụp ảnh</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-1.5 text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors bg-[var(--surface-secondary)]"
        >
          <Icon name="Camera" size={24} />
          <span className="text-xs font-medium">
            Nhấn để chụp ảnh hàng hóa / tem mác
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((_, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface-secondary)] group"
            >
              {previews[idx] && (
                <img
                  src={previews[idx]}
                  alt={`Bằng chứng ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-1 right-1 p-1 bg-[var(--surface)] text-[var(--destructive)] rounded-full shadow-sm hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)] transition-colors"
                title="Xóa ảnh"
              >
                <Icon name="Trash2" size={12} />
              </button>
            </div>
          ))}

          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              <Icon name="Plus" size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
